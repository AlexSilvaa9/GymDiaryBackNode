const { getUsersCollection, verifyToken } = require('../../_db');
const { ObjectId } = require('mongodb');

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

  if (!verifyToken(req, res)) return;

  const username = req.user.sub;
  const usersCollection = await getUsersCollection();

  if (req.method === 'POST') {
    const routineData = req.body;

    if (!routineData.name || !routineData.exercises || !routineData.date) {
      return res.status(400).json({ message: 'Faltan campos requeridos en la rutina' });
    }

    routineData._id = new ObjectId().toString();

    const result = await usersCollection.updateOne(
      { 'account.username': username },
      { $push: { routines: routineData } }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: 'Rutina añadida correctamente' });
    } else {
      res.status(500).json({ message: 'No se pudo añadir la rutina' });
    }
  } else if (req.method === 'GET') {
    const date = req.query.date;

    if (!date) {
      return res.status(400).json({ message: 'Falta el parámetro de fecha en la consulta' });
    }

    const pipeline = [
      { $match: { 'account.username': username } },
      { $unwind: '$routines' },
      { $match: { 'routines.date': date } }
    ];

    const result = await usersCollection.aggregate(pipeline).toArray();
    if (result.length > 0) {
      res.json(result);
    } else {
      res.status(404).json({ message: 'No se encontraron rutinas para la fecha proporcionada' });
    }
  } else if (req.method === 'DELETE') {
    const { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).json({ message: 'Faltan parámetros necesarios en la solicitud' });
    }

    const result = await usersCollection.updateOne(
      { 'account.username': username },
      { $pull: { routines: { name, date } } }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: 'Rutina eliminada correctamente' });
    } else {
      res.status(404).json({ message: 'No se encontró la rutina para el nombre y fecha proporcionados' });
    }
  } else if (req.method === 'PUT') {
    const { name, date, ...updatedRoutine } = req.body;

    if (!name || !date || !Object.keys(updatedRoutine).length) {
      return res.status(400).json({ message: 'Faltan parámetros necesarios en la solicitud' });
    }

    const result = await usersCollection.updateOne(
      { 'account.username': username, 'routines.name': name, 'routines.date': date },
      { $set: { 'routines.$': updatedRoutine } }
    );

    if (result.matchedCount > 0) {
      res.json({ message: 'Rutina actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'No se encontró la rutina para el nombre y fecha proporcionados' });
    }
  } else {
    // Manejo de métodos no permitidos
    res.setHeader('Allow', 'POST, GET, DELETE, PUT');
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
