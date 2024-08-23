const { getUsersCollection, verifyToken } = require('../../_db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!verifyToken(req, res)) return;

  const username = req.user.sub;
  const usersCollection = await getUsersCollection();

  switch (req.method) {
    case 'POST': {
      const { name, date, exercises } = req.body;

      // Verificación de campos requeridos
      if (!name || !date || !exercises || exercises.length === 0) {
        return res.status(400).json({ message: 'Faltan campos requeridos en la rutina' });
      }

      // Verificar si la rutina ya existe
      const existingRoutine = await usersCollection.findOne({
        'account.username': username,
        'routines.name': name,
        'routines.date': date,
      });

      if (existingRoutine) {
        // Actualizar rutina existente
        const result = await usersCollection.updateOne(
          { 'account.username': username, 'routines.name': name, 'routines.date': date },
          { $set: { 'routines.$.exercises': exercises } }
        );

        if (result.matchedCount > 0) {
          res.json({ message: 'Rutina actualizada correctamente' });
        } else {
          res.status(500).json({ message: 'No se pudo actualizar la rutina' });
        }
      } else {
        // Crear nueva rutina
        const routineData = {
          _id: new ObjectId().toString(),
          name,
          date,
          exercises
        };

        const result = await usersCollection.updateOne(
          { 'account.username': username },
          { $push: { routines: routineData } }
        );

        if (result.modifiedCount > 0) {
          res.json({ message: 'Rutina añadida correctamente' });
        } else {
          res.status(500).json({ message: 'No se pudo añadir la rutina' });
        }
      }
      break;
    }

    case 'GET': {
      const date = req.query.date;

      if (!date) {
        return res.status(400).json({ message: 'Falta el parámetro de fecha en la consulta' });
      }

      const pipeline = [
        { $match: { 'account.username': username } },
        { $unwind: '$routines' },
        { $match: { 'routines.date': date } },
        { $project: { _id: 0, routines: 1 } } // Opcional: para devolver solo las rutinas
      ];

      const result = await usersCollection.aggregate(pipeline).toArray();
      if (result.length > 0) {
        res.json(result.map(doc => doc.routines));
      } else {
        res.status(404).json({ message: 'No se encontraron rutinas para la fecha proporcionada' });
      }
      break;
    }

    case 'DELETE': {
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
      break;
    }

    default:
      res.setHeader('Allow', 'POST, GET, DELETE');
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
