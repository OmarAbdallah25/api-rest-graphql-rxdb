const fs = require('fs/promises');
const path = require('path');
const { createHash, randomUUID } = require('crypto');
const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');

const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOT_USERS = path.join(DATA_DIR, 'users.snapshot.json');
const SNAPSHOT_DEVICES = path.join(DATA_DIR, 'devices.snapshot.json');

const userSchema = {
  title: 'user schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    email: { type: 'string', minLength: 3, maxLength: 190 },
    password: { type: 'string', minLength: 1, maxLength: 255 }
  },
  required: ['id', 'name', 'email', 'password'],
  indexes: ['email']
};

const deviceSchema = {
  title: 'device schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    userId: { type: 'string', maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    type: { type: 'string', maxLength: 50 },
    serialNumber: { type: 'string', maxLength: 100 },
    status: { type: 'string', maxLength: 50 }
  },
  required: ['id', 'userId', 'name', 'type', 'serialNumber', 'status'],
  indexes: ['userId']
};

async function hashFunction(input) {
  if (input instanceof ArrayBuffer) input = Buffer.from(input);
  if (typeof Blob !== 'undefined' && input instanceof Blob)
    input = Buffer.from(await input.arrayBuffer());
  if (!Buffer.isBuffer(input)) input = Buffer.from(String(input));
  return createHash('sha256').update(input).digest('hex');
}

async function loadSnapshot(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function persistCollection(collection, file) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const docs = await collection.find().exec();
  await fs.writeFile(file, JSON.stringify(docs.map(d => d.toJSON()), null, 2), 'utf8');
}

async function initDatabase() {
  const storage = wrappedValidateAjvStorage({ storage: getRxStorageMemory() });

  const db = await createRxDatabase({
    name: 'tp6-rxdb',
    storage,
    eventReduce: true,
    multiInstance: false,
    hashFunction
  });

  await db.addCollections({
    users: { schema: userSchema },
    devices: { schema: deviceSchema }
  });

  const initialUsers = await loadSnapshot(SNAPSHOT_USERS);
  if (initialUsers.length > 0) await db.users.bulkInsert(initialUsers);

  const initialDevices = await loadSnapshot(SNAPSHOT_DEVICES);
  if (initialDevices.length > 0) await db.devices.bulkInsert(initialDevices);

  return {
    db,
    users: db.users,
    devices: db.devices,
    persistUsers: () => persistCollection(db.users, SNAPSHOT_USERS),
    persistDevices: () => persistCollection(db.devices, SNAPSHOT_DEVICES),
    createId: () => randomUUID()
  };
}

module.exports = initDatabase();