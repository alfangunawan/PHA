const db = require('../config/db');

// GET /api/meditation-sessions
const getAll = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM meditation_sessions WHERE is_active = TRUE';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id ASC';
    const [rows] = await db.query(query, params);

    // Parse duration_options JSON string if needed
    const sessions = rows.map((row) => ({
      ...row,
      duration_options:
        typeof row.duration_options === 'string'
          ? JSON.parse(row.duration_options)
          : row.duration_options,
    }));

    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('getMeditationSessions error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/meditation-sessions/:id
const getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM meditation_sessions WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Sesi meditasi tidak ditemukan' });
    }
    const session = {
      ...rows[0],
      duration_options:
        typeof rows[0].duration_options === 'string'
          ? JSON.parse(rows[0].duration_options)
          : rows[0].duration_options,
    };
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('getMeditationSession error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/meditation-logs
const saveLog = async (req, res) => {
  try {
    const { session_id, duration, completed } = req.body;
    const user_id = req.user.id;

    if (!session_id || duration === undefined) {
      return res.status(400).json({ success: false, message: 'session_id dan duration wajib diisi' });
    }

    const [result] = await db.query(
      'INSERT INTO meditation_logs (user_id, session_id, duration, completed) VALUES (?, ?, ?, ?)',
      [user_id, session_id, duration, completed ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: completed
        ? 'Selamat! Sesi meditasi berhasil diselesaikan 🧘'
        : 'Sesi meditasi disimpan 🧘',
      data: { id: result.insertId, user_id, session_id, duration, completed },
    });
  } catch (err) {
    console.error('saveMeditationLog error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/meditation-logs
const getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ml.*, ms.title as session_title, ms.category, ms.color_theme
       FROM meditation_logs ml
       JOIN meditation_sessions ms ON ml.session_id = ms.id
       WHERE ml.user_id = ?
       ORDER BY ml.completed_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMeditationHistory error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { getAll, getOne, saveLog, getHistory };
