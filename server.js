const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let usersCollection;

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    const db = client.db('fit');
    usersCollection = db.collection('users');
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token inválido o no proporcionado' });
  
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token inválido o expirado' });
    req.user = decoded;
    next();
  });
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Falta el campo username o password' });

  const user = await usersCollection.findOne({ 'account.username': username });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const isMatch = await bcrypt.compare(password, user.account.password);
  if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

  const token = jwt.sign({ sub: username }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

app.post('/users', async (req, res) => {
  const newUser = req.body;
  const account = newUser.account;

  if (!account || !account.password) return res.status(400).json({ message: 'Falta el campo password en el campo account' });

  const hashedPassword = await bcrypt.hash(account.password, 10);
  account.password = hashedPassword;

  if (await usersCollection.findOne({ 'account.username': account.username })) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  if (!newUser.metrics) newUser.metrics = [];
  if (!newUser.routines) newUser.routines = [];
  if (!newUser.routine_templates) newUser.routine_templates = [];
  if (!newUser.nutrition_log) newUser.nutrition_log = [];

  const result = await usersCollection.insertOne(newUser);
  newUser._id = result.insertedId.toString();
  res.status(201).json(newUser);
});

app.get('/verify-token', verifyToken, (req, res) => {
  res.json({ message: 'Token válido', data: req.user });
});

app.get('/users/me', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const user = await usersCollection.findOne({ 'account.username': username }, { projection: { _id: 0, account: 1 } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(user.account);
});

app.put('/users/me', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const updateData = req.body;
  delete updateData.password;

  const result = await usersCollection.updateOne(
    { 'account.username': username },
    { $set: Object.fromEntries(Object.entries(updateData).map(([k, v]) => [`account.${k}`, v])) }
  );

  if (result.matchedCount > 0) {
    res.json({ message: 'Información actualizada correctamente' });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

app.put('/users/password', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Falta la contraseña actual o nueva' });

  const user = await usersCollection.findOne({ 'account.username': username });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const isMatch = await bcrypt.compare(currentPassword, user.account.password);
  if (!isMatch) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await usersCollection.updateOne(
    { 'account.username': username },
    { $set: { 'account.password': hashedNewPassword } }
  );

  res.json({ message: 'Contraseña actualizada correctamente' });
});

app.get('/users/me/metrics', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const user = await usersCollection.findOne({ 'account.username': username }, { projection: { metrics: 1, _id: 0 } });
  if (!user || !user.metrics) return res.status(404).json({ message: 'No se encontraron métricas' });
  res.json(user.metrics);
});

app.post('/users/me/metrics', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const metricData = req.body;

  if (!metricData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la métrica' });

  await usersCollection.updateOne(
    { 'account.username': username },
    { $push: { metrics: metricData } }
  );

  res.json({ message: 'Métrica añadida correctamente' });
});

app.get('/users/me/meals', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const date = req.query.date;

  if (!date) return res.status(400).json({ message: 'Falta la fecha en la consulta' });

  const user = await usersCollection.findOne({ 'account.username': username }, { projection: { nutrition_log: 1, _id: 0 } });
  if (!user || !user.nutrition_log) return res.status(404).json({ message: 'No se encontraron comidas para la fecha proporcionada' });

  const meals = user.nutrition_log.filter(meal => meal.date === date);
  res.json(meals);
});

app.post('/users/me/meals', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const newMeal = req.body;

  if (!newMeal.date || !newMeal.name || !newMeal.calories || !newMeal.macros) return res.status(400).json({ message: 'Faltan campos requeridos en la comida' });

  await usersCollection.updateOne(
    { 'account.username': username },
    { $push: { nutrition_log: newMeal } }
  );

  res.json({ message: 'Comida añadida correctamente' });
});

app.post('/users/me/routines', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const routineData = req.body;

  if (!routineData.name || !routineData.exercises || !routineData.date) return res.status(400).json({ message: 'Faltan campos requeridos en la rutina' });

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
});

app.get('/users/me/routines/latest', verifyToken, async (req, res) => {
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
});

app.get('/users/me/routines', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const date = req.query.date;

  if (!date) return res.status(400).json({ message: 'Falta el parámetro de fecha en la consulta' });

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
});

app.delete('/users/me/routines', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const { name, date } = req.body;

  if (!name || !date) return res.status(400).json({ message: 'Faltan parámetros necesarios en la solicitud' });

  const result = await usersCollection.updateOne(
    { 'account.username': username },
    { $pull: { routines: { name, date } } }
  );

  if (result.modifiedCount > 0) {
    res.json({ message: 'Rutina eliminada correctamente' });
  } else {
    res.status(404).json({ message: 'No se encontró la rutina para el nombre y fecha proporcionados' });
  }
});

app.put('/users/me/routines', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const { name, date, ...updatedRoutine } = req.body;

  if (!name || !date || !updatedRoutine) return res.status(400).json({ message: 'Faltan parámetros necesarios en la solicitud' });

  const result = await usersCollection.updateOne(
    { 'account.username': username, 'routines.name': name, 'routines.date': date },
    { $set: { 'routines.$': updatedRoutine } }
  );

  if (result.matchedCount > 0) {
    res.json({ message: 'Rutina actualizada correctamente' });
  } else {
    res.status(404).json({ message: 'No se encontró la rutina para el nombre y fecha proporcionados' });
  }
});

app.post('/users/me/routine-templates', verifyToken, async (req, res) => {
  const username = req.user.sub;
  const templateData = req.body;

  if (!templateData.name || !templateData.exercises) return res.status(400).json({ message: 'Faltan campos requeridos en la plantilla de rutina' });

  const existingTemplate = await usersCollection.findOne(
    { 'account.username': username, 'routine_templates.name': templateData.name },
    { projection: { 'routine_templates.$': 1 } }
  );

  if (existingTemplate) {
    const result = await usersCollection.updateOne(
      { 'account.username': username, 'routine_templates.name': templateData.name },
      { $set: { 'routine_templates.$': templateData } }
    );
    if (result.matchedCount > 0) {
      res.json({ message: 'Plantilla de rutina actualizada correctamente' });
    } else {
      res.status(500).json({ message: 'No se pudo actualizar la plantilla de rutina' });
    }
  } else {
    templateData._id = new ObjectId().toString();
    const result = await usersCollection.updateOne(
      { 'account.username': username },
      { $push: { routine_templates: templateData } }
    );
    if (result.modifiedCount > 0) {
      res.status(201).json({ message: 'Plantilla de rutina añadida correctamente' });
    } else {
      res.status(500).json({ message: 'No se pudo añadir la plantilla de rutina' });
    }
  }
});

app.get('/users/me/routine-templates', verifyToken, async (req, res) => {
  const username = req.user.sub;

  const user = await usersCollection.findOne({ 'account.username': username }, { projection: { routine_templates: 1, _id: 0 } });
  if (!user || !user.routine_templates) return res.status(404).json({ message: 'No se encontraron plantillas de rutina' });
  res.json(user.routine_templates);
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
