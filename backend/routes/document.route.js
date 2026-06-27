import express from 'express';
import { getDocuments, uploadDocument, downloadDocument, deleteDocument } from '../controllers/document.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, getDocuments);
router.post('/upload', authenticateToken, uploadDocument);
router.get('/download/:id', authenticateToken, downloadDocument);
router.delete('/:id', authenticateToken, deleteDocument);

export default router;
