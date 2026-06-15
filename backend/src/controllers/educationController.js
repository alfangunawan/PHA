const db = require('../config/db');

// GET /api/education-contents
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { category, source } = req.query;

    let whereClause = 'WHERE ec.is_active = TRUE';
    const params = [];

    if (category) {
      whereClause += ' AND ec.category = ?';
      params.push(category);
    }
    if (source) {
      whereClause += ' AND ec.source = ?';
      params.push(source);
    }

    const countQuery = `SELECT COUNT(*) as total FROM education_contents ec ${whereClause}`;
    const [[{ total }]] = await db.query(countQuery, params);

    const dataQuery = `
      SELECT ec.*, u.name as admin_name
      FROM education_contents ec
      LEFT JOIN users u ON ec.created_by_admin_id = u.id
      ${whereClause}
      ORDER BY ec.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    console.error('getEducationContents error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/education-contents/:id
const getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM education_contents WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Konten tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getEducationContent error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/education-contents (admin only)
const create = async (req, res) => {
  try {
    const { title, description, source, url, thumbnail_url, category, tags } = req.body;

    if (!title || !source || !url) {
      return res.status(400).json({ success: false, message: 'Judul, sumber, dan URL wajib diisi' });
    }

    const validSources = ['youtube', 'tiktok', 'other'];
    if (!validSources.includes(source)) {
      return res.status(400).json({ success: false, message: 'Sumber harus youtube, tiktok, atau other' });
    }

    const [result] = await db.query(
      `INSERT INTO education_contents (title, description, source, url, thumbnail_url, category, tags, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        source,
        url,
        thumbnail_url || null,
        category || 'general',
        tags ? JSON.stringify(tags) : null,
        req.user.id,
      ]
    );

    const [newContent] = await db.query('SELECT * FROM education_contents WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Konten edukasi berhasil ditambahkan',
      data: newContent[0],
    });
  } catch (err) {
    console.error('createEducationContent error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/education-contents/:id (admin only)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, source, url, thumbnail_url, category, tags, is_active } = req.body;

    const [existing] = await db.query('SELECT id FROM education_contents WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Konten tidak ditemukan' });
    }

    await db.query(
      `UPDATE education_contents SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        source = COALESCE(?, source),
        url = COALESCE(?, url),
        thumbnail_url = COALESCE(?, thumbnail_url),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, source, url, thumbnail_url, category, tags ? JSON.stringify(tags) : null, is_active, id]
    );

    const [updated] = await db.query('SELECT * FROM education_contents WHERE id = ?', [id]);
    res.json({ success: true, message: 'Konten berhasil diperbarui', data: updated[0] });
  } catch (err) {
    console.error('updateEducationContent error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/education-contents/:id (admin only) — soft delete
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM education_contents WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Konten tidak ditemukan' });
    }

    await db.query('UPDATE education_contents SET is_active = FALSE WHERE id = ?', [id]);
    res.json({ success: true, message: 'Konten berhasil dihapus' });
  } catch (err) {
    console.error('deleteEducationContent error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
