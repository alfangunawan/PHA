const db = require('../config/db');

// GET /api/breathing-techniques
const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM breathing_techniques WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getBreathingTechniques error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/breathing-techniques/:id
const getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM breathing_techniques WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Teknik pernapasan tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getBreathingTechnique error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/breathing-logs
const saveLog = async (req, res) => {
  try {
    const { technique_id, duration, cycles_completed } = req.body;
    const user_id = req.user.id;

    if (!technique_id || !duration) {
      return res.status(400).json({ success: false, message: 'technique_id dan duration wajib diisi' });
    }

    const [result] = await db.query(
      'INSERT INTO breathing_logs (user_id, technique_id, duration, cycles_completed) VALUES (?, ?, ?, ?)',
      [user_id, technique_id, duration, cycles_completed || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Sesi pernapasan berhasil disimpan 🌬️',
      data: { id: result.insertId, user_id, technique_id, duration, cycles_completed },
    });
  } catch (err) {
    console.error('saveBreathingLog error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/breathing-logs (history for current user)
const getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT bl.*, bt.name as technique_name, bt.color_theme
       FROM breathing_logs bl
       JOIN breathing_techniques bt ON bl.technique_id = bt.id
       WHERE bl.user_id = ?
       ORDER BY bl.completed_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getBreathingHistory error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { getAll, getOne, saveLog, getHistory };
