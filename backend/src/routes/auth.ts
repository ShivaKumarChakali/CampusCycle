import express from 'express';
import prisma from '../prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../utils/email';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, name, campus, gradYear } = req.body;
    if (!email || !email.endsWith('.edu')) return res.status(400).json({ error: 'Must use .edu email' });
    if (!campus) return res.status(400).json({ error: 'Campus required' });
    const token = uuidv4();
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name, campus, gradYear: gradYear || null, verifyToken: token }
    });
    await sendVerificationEmail(user.email, token);
    res.json({ ok: true });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    const user = await prisma.user.findUnique({ where: { verifyToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, verifyToken: null } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(400).json({ error: 'No account' });
    if (!user.isVerified) return res.status(403).json({ error: 'Email not verified' });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', async (req: any, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.json({ user: null });
    const token = auth.replace('Bearer ', '');
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

export default router;
