const express = require('express');
const router = express.Router();
const { getAll, create, remove } = require('../controllers/audioController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

router.get('/', auth, roleCheck('admin'), getAll);
router.post('/', auth, roleCheck('admin'), upload.single('audio'), create);
router.delete('/:id', auth, roleCheck('admin'), remove);

module.exports = router;
