import { Router } from 'express';
import pool from '../db.js';
import { getWaitingQueue } from '../utils/queries.js';

const router = Router();

router.get('/live', async (req, res) => {
  try {
    const patients = await getWaitingQueue(pool);
    res.json({ count: patients.length, patients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
