const { getUsersCollection, verifyToken } = require('../../../_db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');

  if (req.method === 'OPTIONS') {
    // Responder a solicitudes OPTIONS
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    if (!verifyToken(req, res)) return;

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
}
else if (req.method === 'GET') {
  const username = req.user.sub;

  const user = await usersCollection.findOne({ 'account.username': username }, { projection: { routine_templates: 1, _id: 0 } });
  if (!user || !user.routine_templates) return res.status(404).json({ message: 'No se encontraron plantillas de rutina' });
  res.json(user.routine_templates);
}

};
