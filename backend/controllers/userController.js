const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { PAGE_KEYS } = require('../constants/pages');

function sanitizePages(allowedPages) {
  if (!Array.isArray(allowedPages)) return [];
  return [...new Set(allowedPages)].filter(p => PAGE_KEYS.includes(p));
}

// List all staff accounts (never returns passwordHash).
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a staff account: an ID/password plus the pages the admin wants that user to see.
exports.createUser = async (req, res) => {
  try {
    const { username, password, allowedPages } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: normalizedUsername,
      passwordHash,
      allowedPages: sanitizePages(allowedPages),
    });

    const { passwordHash: _omit, ...safeUser } = user.toObject();
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit a staff account: username, page access, active flag, and optionally a new password.
exports.updateUser = async (req, res) => {
  try {
    const { username, password, allowedPages, active } = req.body;
    const update = {};

    if (username !== undefined) update.username = username.toLowerCase().trim();
    if (allowedPages !== undefined) update.allowedPages = sanitizePages(allowedPages);
    if (active !== undefined) update.active = !!active;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Username already exists' });
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
