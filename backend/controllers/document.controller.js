import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { UPLOADS_DIR } from '../config.js';
import { upload } from '../middleware/upload.middleware.js';

// Get all documents (sorted by date descending)
export const getDocuments = (req, res) => {
  try {
    const docs = db.getDocuments();
    const sortedDocs = [...docs].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    res.json(sortedDocs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Internal server error while fetching documents.' });
  }
};

// Upload document (Lecturer only)
export const uploadDocument = (req, res) => {
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
};

// Download/Access PDF File and Increment Stats
export const downloadDocument = (req, res) => {
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
};

// Delete Document (Lecturer only)
export const deleteDocument = (req, res) => {
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
};
