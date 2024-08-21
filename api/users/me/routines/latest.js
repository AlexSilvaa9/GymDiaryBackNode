const { getUsersCollection, verifyToken } = require('../../../_db');

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

  if (req.method === 'GET') {
    // Obtener las rutinas del usuario
    const user = await usersCollection.findOne(
      { 'account.username': username },
      { projection: { routines: 1, _id: 0 } }
    );

    if (!user || !user.routines || user.routines.length === 0) {
      return res.status(404).json({ message: 'No se encontraron rutinas' });
    }

    // Encontrar la rutina más reciente
    const latestRoutine = user.routines.reduce((latest, current) => 
      (new Date(current.date) > new Date(latest.date) ? current : latest), 
      user.routines[0]
    );

    res.json(latestRoutine);
  } else {
    // Manejo de métodos no permitidos
    res.setHeader('Allow', 'GET');
    res.status(405).json({ message: `Método ${req.method} no permitido` });
  }
};
