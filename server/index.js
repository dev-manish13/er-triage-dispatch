import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/db.js';
import triageRoutes from './src/routes/triage.js';
import queueRoutes from './src/routes/queue.js';
import resourcesRoutes from './src/routes/resources.js';
import dispatchRoutes from './src/routes/dispatch.js';
import adminRoutes from './src/routes/admin.js';
import authRoutes from './src/routes/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/triage', triageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Jeevan Milan server running on port ${PORT}`);
});
