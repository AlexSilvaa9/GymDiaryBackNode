const { getUsersCollection, verifyToken } = require('../../../_db');

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

  if (req.method === 'GET') {
    if (!verifyToken(req, res)) return;

    const username = req.user.sub;

  const pipeline = [
    { $match: { 'account.username': username } },
    { $unwind: '$routines' },
    { $sort: { 'routines.date': -1 } },
    { $group: { _id: '$routines.name', latest_routine: { $first: '$routines' } } },
    { $replaceRoot: { newRoot: '$latest_routine' } }
  ];

  const result = await usersCollection.aggregate(pipeline).toArray();
  if (result.length > 0) {
    res.json(result);
  } else {
    res.status(404).json({ message: 'No se encontraron rutinas' });
  }
}};