const { getUsersCollection, verifyToken } = require('../../_db');

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
  const user = await usersCollection.findOne({ 'account.username': username }, { projection: { metrics: 1, _id: 0 } });
  if (!user || !user.metrics) return res.status(404).json({ message: 'No se encontraron métricas' });
  res.json(user.metrics);
} else if (req.method === 'POST') {
  const username = req.user.sub;
  const metricData = req.body;

  if (!metricData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la métrica' });

  await usersCollection.updateOne(
    { 'account.username': username },
    { $push: { metrics: metricData } }
  );

  res.json({ message: 'Métrica añadida correctamente' });
}
};