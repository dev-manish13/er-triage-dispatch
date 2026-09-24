import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [doctors] = await pool.query(
      `SELECT doctor_id, full_name, \`rank\`, shift, shift_start_time, shift_end
       FROM doctors WHERE status = 'Available'`,
    );
    const [beds] = await pool.query(
      `SELECT bed_id, bed_number, bed_type FROM beds WHERE status = 'Available'`,
    );
    res.json({ doctors, beds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
