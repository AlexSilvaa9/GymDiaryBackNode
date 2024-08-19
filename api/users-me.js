const { MongoClient } = require('mongodb');
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
    if (req.method === 'GET') {
      const user = await usersCollection.findOne({ 'account.username': username }, { projection: { _id: 0, account: 1 } });
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json(user.account);
    } else if (req.method === 'PUT') {
      const updateData = req.body;
      delete updateData.password;

      const result = await usersCollection.updateOne(
        { 'account.username': username },
        { : Object.fromEntries(Object.entries(updateData).map(([k, v]) => [, v])) }
      );

      if (result.matchedCount > 0) {
        res.json({ message: 'Información actualizada correctamente' });
      } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
      }
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  });
};
