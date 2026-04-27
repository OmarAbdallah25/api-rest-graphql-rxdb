const fs = require('fs');
const path = require('path');
const express = require('express');
const { buildSchema } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');

const userResolver = require('./userResolver');
const { _business: biz } = userResolver;

const app = express();
const port = 5000;

const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')
);

app.use(express.json());

// ─── PAGE D'ACCUEIL ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'API REST/GraphQL avec RxDB — TP6',
    rest: {
      users: {
        list:   'GET    /users',
        one:    'GET    /users/:id',
        create: 'POST   /users',
        update: 'PUT    /users/:id',
        delete: 'DELETE /users/:id'
      },
      devices: {
        list:      'GET    /devices',
        one:       'GET    /devices/:id',
        byUser:    'GET    /users/:userId/devices',
        create:    'POST   /devices',
        update:    'PUT    /devices/:id',
        delete:    'DELETE /devices/:id'
      }
    },
    graphql: 'POST /graphql'
  });
});

// ─── GRAPHQL ─────────────────────────────────────────────────────────────────
app.all('/graphql', createHandler({ schema, rootValue: userResolver }));

// ─── REST — USERS ─────────────────────────────────────────────────────────────
app.get('/users', async (req, res) => {
  const users = await biz.getAllUsers();
  res.json(users);
});

app.get('/users/:id', async (req, res) => {
  const user = await biz.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(user);
});

app.post('/users', async (req, res) => {
  try {
    const created = await biz.addUser(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const updated = await biz.updateUser({ id: req.params.id, ...req.body });
    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const deleted = await biz.deleteUser({ id: req.params.id });
  if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ message: 'Utilisateur supprimé avec succès' });
});

// ─── REST — DEVICES ───────────────────────────────────────────────────────────
app.get('/devices', async (req, res) => {
  const devices = await biz.getAllDevices();
  res.json(devices);
});

app.get('/devices/:id', async (req, res) => {
  const device = await biz.getDeviceById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device non trouvé' });
  res.json(device);
});

app.get('/users/:userId/devices', async (req, res) => {
  const devices = await biz.getDevicesByUser(req.params.userId);
  res.json(devices);
});

app.post('/devices', async (req, res) => {
  try {
    const created = await biz.addDevice(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/devices/:id', async (req, res) => {
  try {
    const updated = await biz.updateDevice({ id: req.params.id, ...req.body });
    if (!updated) return res.status(404).json({ error: 'Device non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/devices/:id', async (req, res) => {
  const deleted = await biz.deleteDevice({ id: req.params.id });
  if (!deleted) return res.status(404).json({ error: 'Device non trouvé' });
  res.json({ message: 'Device supprimé avec succès' });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${port}`);
  console.log(`📊 GraphQL disponible sur http://localhost:${port}/graphql`);
});