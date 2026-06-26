import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database file if it doesn't exist
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      documents: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

initDb();

// Read operations
function readDb() {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [], documents: [] };
  }
}

// Write operations
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
}

export const db = {
  // Users CRUD
  getUsers: () => {
    return readDb().users;
  },

  findUserByUsername: (username) => {
    const users = readDb().users;
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  findUserById: (id) => {
    const users = readDb().users;
    return users.find(u => u.id === id);
  },

  createUser: (user) => {
    const data = readDb();
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...user,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  // Documents CRUD
  getDocuments: () => {
    return readDb().documents;
  },

  findDocumentById: (id) => {
    const docs = readDb().documents;
    return docs.find(d => d.id === id);
  },

  createDocument: (doc) => {
    const data = readDb();
    const newDoc = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...doc,
      downloadCount: 0,
      uploadDate: new Date().toISOString()
    };
    data.documents.push(newDoc);
    writeDb(data);
    return newDoc;
  },

  deleteDocument: (id) => {
    const data = readDb();
    const index = data.documents.findIndex(d => d.id === id);
    if (index !== -1) {
      const deletedDoc = data.documents.splice(index, 1)[0];
      writeDb(data);
      return deletedDoc;
    }
    return null;
  },

  incrementDownloadCount: (id) => {
    const data = readDb();
    const doc = data.documents.find(d => d.id === id);
    if (doc) {
      doc.downloadCount = (doc.downloadCount || 0) + 1;
      writeDb(data);
      return doc;
    }
    return null;
  }
};
