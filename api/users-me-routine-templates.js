const { MongoClient, ObjectId } = require('mongodb');
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
      const user = await usersCollection.findOne({ 'account.username': username }, { projection: { routine_templates: 1, _id: 0 } });
      if (!user || !user.routine_templates) return res.status(404).json({ message: 'No se encontraron plantillas de rutina' });
      res.json(user.routine_templates);
    } else if (req.method === 'POST') {
      const templateData = req.body;

      if (!templateData.name || !templateData.exercises) return res.status(400).json({ message: 'Faltan campos requeridos en la plantilla' });

      templateData._id = new ObjectId().toString();

      await usersCollection.updateOne(
        { 'account.username': username },
        { : { routine_templates: templateData } }
      );

      res.json({ message: 'Plantilla de rutina añadida correctamente' });
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  });
};
