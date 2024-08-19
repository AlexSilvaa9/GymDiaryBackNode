const { MongoClient } = require('mongodb');
const verifyToken = require('./verify-token');
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
  verifyToken(req, res, async () => {
    const username = req.user.sub;

    const pipeline = [
      { : { 'account.username': username } },
      { : '' },
      { : { 'routines.date': -1 } },
      { : { _id: '.name', latest_routine: { : '' } } },
      { : { newRoot: '' } }
    ];

    const result = await usersCollection.aggregate(pipeline).toArray();
    if (result.length > 0) {
      res.json(result);
    } else {
      res.status(404).json({ message: 'No se encontraron rutinas' });
    }
  });
};
