const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

// Staff Management — creating/editing logins and their page access is admin-only.
router.use(requireAuth, requireAdmin);

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
