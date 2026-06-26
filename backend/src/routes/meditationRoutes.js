const express = require('express');
const router = express.Router();
const { getAll, getOne, saveLog, getHistory } = require('../controllers/meditationController');
const auth = require('../middleware/auth');

router.get('/sessions', auth, getAll);
router.get('/sessions/:id', auth, getOne);
router.post('/logs', auth, saveLog);
router.get('/logs', auth, getHistory);

module.exports = router;
