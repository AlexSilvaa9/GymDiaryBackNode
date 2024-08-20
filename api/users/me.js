const { getUsersCollection, verifyToken } = require('../_db');

module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');

  if (req.method === 'OPTIONS') {
    // Responder a solicitudes OPTIONS
    res.status(200).end();
    return;
  }

  if (req.method === 'PUT') {
    if (!verifyToken(req, res)) return;

    const username = req.user.sub;
    const updateData = req.body;
    delete updateData.password;
  
    const result = await usersCollection.updateOne(
      { 'account.username': username },
      { $set: Object.fromEntries(Object.entries(updateData).map(([k, v]) => [`account.${k}`, v])) }
    );
  
    if (result.matchedCount > 0) {
      res.json({ message: 'Información actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  }
};