import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';

const router = express.Router();

router.get('/me', authRequired, async (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

router.patch('/me', authRequired, async (req: AuthedRequest, res) => {
  const data: any = {};
  const { name, campus, gradYear, avatar } = req.body;
  if (name) data.name = name;
  if (campus) data.campus = campus;
  if (gradYear) data.gradYear = gradYear;
  if (avatar) data.avatar = avatar;
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user });
});

export default router;
