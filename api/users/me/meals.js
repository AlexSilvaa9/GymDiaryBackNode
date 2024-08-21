const { getUsersCollection, verifyToken } = require('../../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!verifyToken(req, res)) return;

  const username = req.user.sub;
  const usersCollection = await getUsersCollection();

  if (req.method === 'GET') {
    const date = req.query.date;
    if (!date) return res.status(400).json({ message: 'Falta la fecha en la consulta' });

    const user = await usersCollection.findOne({ 'account.username': username }, { projection: { nutrition_log: 1, _id: 0 } });
    if (!user || !user.nutrition_log) return res.status(404).json({ message: 'No se encontraron comidas para la fecha proporcionada' });

    const meals = user.nutrition_log.filter(meal => meal.date === date);
    res.json(meals);
  } else if (req.method === 'POST') {
    const newMeal = req.body;
    if (!newMeal.date || !newMeal.name || !newMeal.calories || !newMeal.macros) return res.status(400).json({ message: 'Faltan campos requeridos en la comida' });

    await usersCollection.updateOne(
      { 'account.username': username },
      { $push: { nutrition_log: newMeal } }
    );

    res.json({ message: 'Comida añadida correctamente' });
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
};
