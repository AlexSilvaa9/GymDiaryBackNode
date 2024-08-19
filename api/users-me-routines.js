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
    if (req.method === 'POST') {
      const routineData = req.body;

      if (!routineData.name || !routineData.exercises || !routineData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la rutina' });

      routineData._id = new ObjectId().toString();

      const result = await usersCollection.updateOne(
        { 'account.username': username },
        { : { routines: routineData } }
      );

      if (result.modifiedCount > 0) {
        res.json({ message: 'Rutina añadida correctamente' });
      } else {
        res.status(500).json({ message: 'No se pudo añadir la rutina' });
      }
    } else if (req.method === 'GET') {
      const date = req.query.date;

      if (!date) return res.status(400).json({ message: 'Falta el parámetro de fecha en la consulta' });

      const pipeline = [
        { : { 'account.username': username } },
        { : '' },
        { : { 'routines.date': date } }
      ];

      const result = await usersCollection.aggregate(pipeline).toArray();
      if (result.length > 0) {
        const routines = result.map(r => r.routines);
        res.json(routines);
      } else {
        res.status(404).json({ message: 'No se encontraron rutinas para la fecha proporcionada' });
      }
    } else if (req.method === 'PUT') {
      const routineData = req.body;

      if (!routineData._id || !routineData.name || !routineData.exercises || !routineData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la rutina' });

      const result = await usersCollection.updateOne(
        { 'account.username': username, 'routines._id': routineData._id },
        { : { 'routines.$': routineData } }
      );

      if (result.matchedCount > 0) {
        res.json({ message: 'Rutina actualizada correctamente' });
      } else {
        res.status(404).json({ message: 'No se encontró la rutina para actualizar' });
      }
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  });
};
