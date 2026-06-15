const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/educationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public-ish (still requires login)
router.get('/', auth, getAll);
router.get('/:id', auth, getOne);

// Admin only
router.post('/', auth, roleCheck('admin'), create);
router.put('/:id', auth, roleCheck('admin'), update);
router.delete('/:id', auth, roleCheck('admin'), remove);

module.exports = router;
