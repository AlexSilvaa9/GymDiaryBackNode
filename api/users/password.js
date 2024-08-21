const { getUsersCollection, verifyToken } = require('../_db');
const bcrypt = require('bcrypt');

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
    const { currentPassword, newPassword } = req.body;

    // Validar que se proporcionaron contraseñas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Falta la contraseña actual o nueva' });
    }

    const usersCollection = await getUsersCollection();

    // Buscar el usuario en la base de datos
    const user = await usersCollection.findOne({ 'account.username': username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar la contraseña actual con la almacenada
    const isMatch = await bcrypt.compare(currentPassword, user.account.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    // Hashear la nueva contraseña y actualizar en la base de datos
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne(
      { 'account.username': username },
      { $set: { 'account.password': hashedNewPassword } }
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } else {
    res.setHeader('Allow', 'PUT');
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
