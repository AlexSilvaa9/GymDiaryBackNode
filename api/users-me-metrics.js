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
      const user = await usersCollection.findOne({ 'account.username': username }, { projection: { metrics: 1, _id: 0 } });
      if (!user || !user.metrics) return res.status(404).json({ message: 'No se encontraron métricas' });
      res.json(user.metrics);
    } else if (req.method === 'POST') {
      const metricData = req.body;

      if (!metricData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la métrica' });

      await usersCollection.updateOne(
        { 'account.username': username },
        { : { metrics: metricData } }
      );

      res.json({ message: 'Métrica añadida correctamente' });
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  });
};
