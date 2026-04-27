const dbPromise = require('./db');

function toJson(doc) {
  return doc ? doc.toJSON() : null;
}

async function ensureUniqueEmail(users, email, excludedId = null) {
  const existing = await users.findOne({ selector: { email } }).exec();
  if (existing && existing.primary !== excludedId) {
    throw new Error('Adresse e-mail déjà utilisée');
  }
}

// ─── USER BUSINESS LOGIC ────────────────────────────────────────────────────

async function getAllUsers() {
  const { users } = await dbPromise;
  const docs = await users.find().exec();
  return Promise.all(docs.map(async (doc) => {
    const u = doc.toJSON();
    u.devices = await getDevicesByUser(u.id);
    return u;
  }));
}

async function getUserById(id) {
  const { users } = await dbPromise;
  const doc = await users.findOne(id).exec();
  if (!doc) return null;
  const u = doc.toJSON();
  u.devices = await getDevicesByUser(u.id);
  return u;
}

async function addUser({ name, email, password }) {
  const { users, persistUsers, createId } = await dbPromise;
  await ensureUniqueEmail(users, email);
  const inserted = await users.insert({ id: createId(), name, email, password });
  await persistUsers();
  const u = inserted.toJSON();
  u.devices = [];
  return u;
}

async function updateUser({ id, name, email, password }) {
  const { users, persistUsers } = await dbPromise;
  const doc = await users.findOne(id).exec();
  if (!doc) return null;
  await ensureUniqueEmail(users, email, id);
  const updated = await doc.incrementalPatch({ name, email, password });
  await persistUsers();
  const u = updated.toJSON();
  u.devices = await getDevicesByUser(u.id);
  return u;
}

async function deleteUser({ id }) {
  const { users, devices, persistUsers, persistDevices } = await dbPromise;
  const doc = await users.findOne(id).exec();
  if (!doc) return false;
  // Suppression automatique des devices liés
  const userDevices = await devices.find({ selector: { userId: id } }).exec();
  await Promise.all(userDevices.map(d => d.remove()));
  await doc.remove();
  await persistUsers();
  await persistDevices();
  return true;
}

// ─── DEVICE BUSINESS LOGIC ──────────────────────────────────────────────────

async function getAllDevices() {
  const { devices } = await dbPromise;
  const docs = await devices.find().exec();
  return docs.map(d => d.toJSON());
}

async function getDeviceById(id) {
  const { devices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  return toJson(doc);
}

async function getDevicesByUser(userId) {
  const { devices } = await dbPromise;
  const docs = await devices.find({ selector: { userId } }).exec();
  return docs.map(d => d.toJSON());
}

async function addDevice({ userId, name, type, serialNumber, status }) {
  const { users, devices, persistDevices, createId } = await dbPromise;
  // Vérifier que l'utilisateur existe
  const userDoc = await users.findOne(userId).exec();
  if (!userDoc) throw new Error('Utilisateur non trouvé');
  const inserted = await devices.insert({ id: createId(), userId, name, type, serialNumber, status });
  await persistDevices();
  return inserted.toJSON();
}

async function updateDevice({ id, name, type, serialNumber, status }) {
  const { devices, persistDevices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  if (!doc) return null;
  const updated = await doc.incrementalPatch({ name, type, serialNumber, status });
  await persistDevices();
  return updated.toJSON();
}

async function deleteDevice({ id }) {
  const { devices, persistDevices } = await dbPromise;
  const doc = await devices.findOne(id).exec();
  if (!doc) return false;
  await doc.remove();
  await persistDevices();
  return true;
}

// ─── RESOLVERS GRAPHQL ───────────────────────────────────────────────────────

module.exports = {
  // Queries
  users: getAllUsers,
  user: ({ id }) => getUserById(id),
  devices: getAllDevices,
  device: ({ id }) => getDeviceById(id),
  devicesByUser: ({ userId }) => getDevicesByUser(userId),

  // User Mutations
  addUser,
  updateUser,
  deleteUser,

  // Device Mutations
  addDevice,
  updateDevice,
  deleteDevice,

  // Business logic exportée pour REST
  _business: {
    getAllUsers, getUserById, addUser, updateUser, deleteUser,
    getAllDevices, getDeviceById, getDevicesByUser, addDevice, updateDevice, deleteDevice
  }
};