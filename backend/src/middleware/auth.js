const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token autentikasi diperlukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from DB
    const [rows] = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Sesi telah berakhir, silakan login kembali' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

module.exports = auth;
