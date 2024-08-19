const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
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

  if (req.method === 'POST') {
    const newUser = req.body;
    const account = newUser.account;

    if (!account || !account.password) return res.status(400).json({ message: 'Falta el campo password en el campo account' });

    const hashedPassword = await bcrypt.hash(account.password, 10);
    account.password = hashedPassword;

    if (await usersCollection.findOne({ 'account.username': account.username })) {
      return res.status(400).json({ message: 'El usuario ya existe' });
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
