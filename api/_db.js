const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);

async function getUsersCollection() {
  // Verificar si el cliente está conectado usando `client.topology`
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }

  const db = client.db('fit');
  return db.collection('users');
}

function verifyToken(req, res) {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token inválido o no proporcionado' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return true;
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
    return false;
  }
}

module.exports = { getUsersCollection, verifyToken };
