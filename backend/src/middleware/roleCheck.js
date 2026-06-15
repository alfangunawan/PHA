/**
 * Role-based access control middleware
 * Usage: roleCheck('admin') or roleCheck('admin', 'superadmin')
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat melakukan aksi ini.',
      });
    }

    next();
  };
};

module.exports = roleCheck;
