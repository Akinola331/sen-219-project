import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'elearning_secret_key_987654321';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically for previews
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate clean file name with timestamp
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${cleanName}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept PDFs
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed!'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: 'All fields (username, password, name, role) are required.' });
    }

    if (role !== 'lecturer' && role !== 'student') {
      return res.status(400).json({ message: 'Role must be either "lecturer" or "student".' });
    }

    // Check if user exists
    const existingUser = db.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user
    const newUser = db.createUser({
      username,
      name,
      role,
      passwordHash
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Compare passwords
    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  });
});

// --- DOCUMENT ROUTES ---

// Get all documents
app.get('/api/documents', authenticateToken, (req, res) => {
  try {
    const docs = db.getDocuments();
    // Sort by upload date descending (newest first)
    const sortedDocs = [...docs].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    res.json(sortedDocs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Internal server error while fetching documents.' });
  }
});

// Upload document (Lecturer only)
app.post('/api/documents/upload', authenticateToken, (req, res) => {
  // Check role
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Access denied. Only lecturers can upload files.' });
  }

  upload.single('pdf')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a PDF document to upload.' });
    }

    const { title, description, course } = req.body;

    if (!title || !course) {
      // Clean up uploaded file if fields are missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Document Title and Course/Subject are required.' });
    }

    try {
      const newDoc = db.createDocument({
        title,
        description: description || '',
        course,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadedBy: req.user.id,
        uploaderName: req.user.name
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: newDoc
      });
    } catch (error) {
      console.error('Database write error during upload:', error);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      res.status(500).json({ message: 'Internal server error while saving document metadata.' });
    }
  });
});

// Download/Access PDF File and Increment Stats
app.get('/api/documents/download/:id', authenticateToken, (req, res) => {
  try {
    const docId = req.params.id;
    const document = db.findDocumentById(docId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const filePath = path.join(UPLOADS_DIR, document.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on the server.' });
    }

    // Increment count in DB
    db.incrementDownloadCount(docId);

    // Send the file
    res.download(filePath, document.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Error downloading the file.' });
  }
});

// Delete Document (Lecturer only)
app.delete('/api/documents/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ message: 'Access denied. Only lecturers can delete documents.' });
    }

    const docId = req.params.id;
    const document = db.findDocumentById(docId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Make sure the uploader is the one deleting
    if (document.uploadedBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own documents.' });
    }

    // Remove from database
    db.deleteDocument(docId);

    // Remove physical file
    const filePath = path.join(UPLOADS_DIR, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Error deleting the document.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
