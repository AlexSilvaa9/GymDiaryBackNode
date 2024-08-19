const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
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
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Falta el campo username o password' });

    const user = await usersCollection.findOne({ 'account.username': username });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.account.password);
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ sub: username }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
};
