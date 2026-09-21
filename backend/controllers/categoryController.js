const Category = require('../models/Category');
const Product = require('../models/Product');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    
    // Check if exists
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Category name is required' });
    const existing = await Category.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, icon, description });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const current = await Category.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Category not found' });

    const { name, icon, description, active } = req.body;
    const newName = typeof name === 'string' ? name.trim() : current.name;
    if (!newName) return res.status(400).json({ message: 'Category name is required' });
    if (newName.toLowerCase() !== current.name.toLowerCase()) {
      const clash = await Category.findOne({ _id: { $ne: current._id }, name: new RegExp(`^${escapeRegex(newName)}$`, 'i') });
      if (clash) return res.status(400).json({ message: 'Another category already uses that name' });
    }

    const oldName = current.name;
    Object.assign(current, { name: newName });
    if (icon !== undefined) current.icon = icon;
    if (description !== undefined) current.description = description;
    if (active !== undefined) current.active = active;
    const category = await current.save();

    // Products store the category by name, so a rename must carry them along —
    // otherwise they keep the old name and the category lists drift apart.
    if (oldName !== newName) await Product.updateMany({ category: oldName }, { category: newName });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    // Don't leave products pointing at a category that no longer exists.
    const moved = await Product.updateMany({ category: category.name }, { category: 'Other' });
    res.json({ message: 'Category deleted', productsMovedToOther: moved.modifiedCount || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
