const { getUsersCollection, verifyToken } = require('../_db');

module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    // Responder a solicitudes OPTIONS
    res.status(200).end();
    return;
  }

  if (req.method === 'PUT') {
    if (!verifyToken(req, res)) return;

    const username = req.user.sub;
    const updateData = req.body;

    // Eliminar el campo password si está presente en el cuerpo de la solicitud
    if (updateData.password) delete updateData.password;

    // Crear el objeto de actualización con el prefijo 'account.'
    const updateFields = Object.fromEntries(
      Object.entries(updateData).map(([k, v]) => [`account.${k}`, v])
    );

    const usersCollection = await getUsersCollection();
    const result = await usersCollection.updateOne(
      { 'account.username': username },
      { $set: updateFields }
    );

    if (result.matchedCount > 0) {
      res.json({ message: 'Información actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } else if (req.method === 'GET') {
    if (!verifyToken(req, res)) return;

    const username = req.user.sub;
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ 'account.username': username });

    if (user) {
      res.json(user.account);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  }else {
    // Manejo de métodos no permitidos
    res.setHeader('Allow', 'PUT');
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
