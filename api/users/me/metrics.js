const { getUsersCollection, verifyToken } = require('../../_db');

module.exports = async (req, res) => {
  try {
    // Configuración CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Verificación del token
    if (!verifyToken(req, res)) return;

    const username = req.user.sub;
    const usersCollection = await getUsersCollection();

    if (req.method === 'GET') {
      const user = await usersCollection.findOne({ 'account.username': username }, { projection: { metrics: 1, _id: 0 } });
      if (!user || !user.metrics) return res.status(404).json({ message: 'No se encontraron métricas' });
      res.json(user.metrics);

    } else if (req.method === 'POST') {
      const metricData = req.body;

      if (!metricData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la métrica' });

      // Verificar si ya existe una métrica con la misma fecha
      const existingMetric = await usersCollection.findOne(
        { 'account.username': username, 'metrics.date': metricData.date },
        { projection: { _id: 1 } }
      );

      if (existingMetric) {
        return res.status(400).json({ message: 'Ya existe una métrica con la misma fecha' });
      }

      await usersCollection.updateOne(
        { 'account.username': username },
        { $push: { metrics: metricData } }
      );

      res.json({ message: 'Métrica añadida correctamente' });

    } else if (req.method === 'DELETE') {
      const { date } = req.body;

      if (!date) return res.status(400).json({ message: 'Falta la fecha en la solicitud de eliminación' });

      const result = await usersCollection.updateOne(
        { 'account.username': username },
        { $pull: { metrics: { date } } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'No se encontró la métrica para eliminar' });
      }

      res.json({ message: 'Métrica eliminada correctamente' });

    } else {
      res.setHeader('Allow', 'GET, POST, DELETE');
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
