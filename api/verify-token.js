const { verifyToken } = require('./_db');

module.exports = (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');

  if (req.method === 'OPTIONS') {
    // Responder a solicitudes OPTIONS
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    if (verifyToken(req, res)) {
      res.json({ message: 'Token válido', data: req.user });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
};
