# TP6 — API REST & GraphQL avec RxDB

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![RxDB](https://img.shields.io/badge/RxDB-8D1F89?style=for-the-badge&logo=rxdb&logoColor=white)

> API complète REST + GraphQL exposant les mêmes données via deux interfaces,
> persistées localement avec **RxDB** (base NoSQL orientée documents JSON).

---

## 🎯 Objectifs

- Créer une API REST CRUD complète sur les ressources **User** et **Device**
- Créer un service **GraphQL** pour les mêmes opérations CRUD
- Utiliser **RxDB** comme couche de persistance locale (JSON)
- Vérifier l'interopérabilité REST ↔ GraphQL sur la même base de données
- Implémenter une relation de composition **User → Devices**

---

## 🛠️ Tech Stack

| Catégorie     | Technologies              |
|---------------|---------------------------|
| Serveur HTTP  | Node.js, Express          |
| GraphQL       | graphql, graphql-http     |
| Persistance   | RxDB, RxJS, LokiJS        |
| Test API      | Postman, curl, navigateur |

---

## 📁 Structure du projet
api-rest-graphql-rxdb/
│
├── server.js           ← Point d'entrée Express + routes REST + GraphQL
├── schema.gql          ← Schéma GraphQL (User + Device)
├── db.js               ← Configuration RxDB (collections users + devices)
├── userResolver.js     ← Logique métier + résolveurs GraphQL
├── data/               ← Snapshots JSON (persistance locale)
│   ├── users.snapshot.json
│   └── devices.snapshot.json
├── .gitignore
├── package.json
└── README.md

---

## ⚙️ Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/TonUsername/api-rest-graphql-rxdb.git
cd api-rest-graphql-rxdb
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Démarrer le serveur

```bash
node server.js
```

---

## 🔌 Endpoints REST

### Users

| Méthode | Route            | Description              |
|---------|------------------|--------------------------|
| GET     | /users           | Lister tous les users    |
| GET     | /users/:id       | Récupérer un user        |
| POST    | /users           | Créer un user            |
| PUT     | /users/:id       | Modifier un user         |
| DELETE  | /users/:id       | Supprimer un user        |

### Devices

| Méthode | Route                   | Description                  |
|---------|-------------------------|------------------------------|
| GET     | /devices                | Lister tous les devices      |
| GET     | /devices/:id            | Récupérer un device          |
| GET     | /users/:userId/devices  | Devices d'un user            |
| POST    | /devices                | Créer un device              |
| PUT     | /devices/:id            | Modifier un device           |
| DELETE  | /devices/:id            | Supprimer un device          |

---

## 📐 Schéma GraphQL

```graphql
type User {
  id: String!
  name: String!
  email: String!
  password: String!
  devices: [Device!]!
}

type Device {
  id: String!
  userId: String!
  name: String!
  type: String!
  serialNumber: String!
  status: String!
}

type Query {
  users: [User!]!
  user(id: String!): User
  devices: [Device!]!
  device(id: String!): Device
  devicesByUser(userId: String!): [Device!]!
}

type Mutation {
  addUser(name: String!, email: String!, password: String!): User
  updateUser(id: String!, name: String!, email: String!, password: String!): User
  deleteUser(id: String!): Boolean!
  addDevice(userId: String!, name: String!, type: String!, serialNumber: String!, status: String!): Device
  updateDevice(id: String!, name: String!, type: String!, serialNumber: String!, status: String!): Device
  deleteDevice(id: String!): Boolean!
}
```

---

## 🧪 Exemples de requêtes

### REST — Créer un utilisateur (PowerShell)

```powershell
$body = '{"name":"Ali","email":"ali@example.com","password":"123456"}'
Invoke-WebRequest -Uri http://localhost:5000/users -Method POST -ContentType "application/json" -Body $body
```

### GraphQL — Consulter les utilisateurs

```graphql
{
  users {
    id
    name
    email
    devices {
      name
      type
      status
    }
  }
}
```

### GraphQL — Ajouter un device

```graphql
mutation {
  addDevice(
    userId: "<id>"
    name: "iPhone 15"
    type: "smartphone"
    serialNumber: "SN-002"
    status: "active"
  ) {
    id
    name
    status
  }
}
```

---

## 👨‍💻 Auteur

| Champ        | Info                          |
|--------------|-------------------------------|
| **Étudiant** | Abdallah Omar                   |
| **Classe**   | 4 Info                         |
| **Enseignant** | Dr. Salah Gontara           |
| **Année**    | 2025/2026                     |

---

## 📄 Licence

Projet réalisé dans le cadre universitaire — usage éducatif uniquement.
