const { verifyToken } = require('./_db');

module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    // Responder a solicitudes OPTIONS
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    if (!verifyToken(req, res)) {
      return res.status(401).json({ message: 'Token no válido' });
    }

    res.json({ message: 'Token válido', data: req.user });
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
};
