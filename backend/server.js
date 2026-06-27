import express from 'express';
import cors from 'cors';
import { PORT, UPLOADS_DIR } from './config.js';
import authRoutes from './routes/auth.route.js';
import documentRoutes from './routes/document.route.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically for previews
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
