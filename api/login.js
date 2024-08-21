const { getUsersCollection } = require('./_db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Falta el campo username o password' });

    const usersCollection = await getUsersCollection();
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
