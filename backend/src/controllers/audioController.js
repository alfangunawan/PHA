const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// GET /api/audio-contents (admin)
const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ac.*, u.name as admin_name
       FROM audio_contents ac
       LEFT JOIN users u ON ac.created_by_admin_id = u.id
       ORDER BY ac.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAudioContents error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/audio-contents (admin) — with file upload
const create = async (req, res) => {
  try {
    const { title, category, duration, description } = req.body;

    if (!title) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Judul wajib diisi' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File audio wajib diunggah' });
    }

    const file_url = `/uploads/${req.file.filename}`;

    const [result] = await db.query(
      `INSERT INTO audio_contents (title, file_url, category, duration, description, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, file_url, category || 'general', duration || null, description || null, req.user.id]
    );

    const [newAudio] = await db.query('SELECT * FROM audio_contents WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Audio berhasil diunggah',
      data: newAudio[0],
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('createAudioContent error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/audio-contents/:id (admin)
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM audio_contents WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Audio tidak ditemukan' });
    }

    // Remove physical file
    const filePath = path.join(process.cwd(), existing[0].file_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query('DELETE FROM audio_contents WHERE id = ?', [id]);
    res.json({ success: true, message: 'Audio berhasil dihapus' });
  } catch (err) {
    console.error('deleteAudioContent error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { getAll, create, remove };
