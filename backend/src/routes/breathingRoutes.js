const express = require('express');
const router = express.Router();
const { getAll, getOne, saveLog, getHistory } = require('../controllers/breathingController');
const auth = require('../middleware/auth');

router.get('/techniques', auth, getAll);
router.get('/techniques/:id', auth, getOne);
router.post('/logs', auth, saveLog);
router.get('/logs', auth, getHistory);

module.exports = router;
