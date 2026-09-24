import { Router } from 'express';

const router = Router();

// Demo-grade credential check for the Admin Panel gate — no session/token
// issuance, just a pass/fail the client uses to unlock the panel for this tab.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12345';

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Invalid username or password' });
});

export default router;
