const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token inválido o no proporcionado' });
  
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token inválido o expirado' });
    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;
