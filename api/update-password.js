const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const verifyToken = require('./verify-token');
require('dotenv').config();

let client;
let usersCollection;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db('fit');
    usersCollection = db.collection('users');
  }
}

module.exports = async (req, res) => {
  await connectToDatabase();
  verifyToken(req, res, async () => {
    const username = req.user.sub;
    if (req.method === 'PUT') {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Falta la contraseña actual o nueva' });

      const user = await usersCollection.findOne({ 'account.username': username });
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      const isMatch = await bcrypt.compare(currentPassword, user.account.password);
      if (!isMatch) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await usersCollection.updateOne(
        { 'account.username': username },
        { : { 'account.password': hashedNewPassword } }
      );

      res.json({ message: 'Contraseña actualizada correctamente' });
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  });
};
