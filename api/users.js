const { getUsersCollection } = require('./_db');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const newUser = req.body;
    const account = newUser.account;

    if (!account || !account.password) return res.status(400).json({ message: 'Falta el campo password en el campo account' });

    const usersCollection = await getUsersCollection();
    const hashedPassword = await bcrypt.hash(account.password, 10);
    account.password = hashedPassword;

    if (await usersCollection.findOne({ 'account.username': account.username })) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    } else if (await usersCollection.findOne({ 'account.email': account.email })) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    newUser.metrics = newUser.metrics || [];
    newUser.routines = newUser.routines || [];
    newUser.routine_templates = newUser.routine_templates || [];
    newUser.nutrition_log = newUser.nutrition_log || [];

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId.toString();
    res.status(201).json(newUser);
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
};
