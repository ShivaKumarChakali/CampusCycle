import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const userId = req.user.id;
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: { messages: { orderBy: { createdAt: 'desc' } }, userA: true, userB: true }
  });
  res.json({ convos });
});

router.post('/', authRequired, async (req: AuthedRequest, res) => {
  const { otherUserId } = req.body;
  if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });
  if (otherUserId === req.user.id) return res.status(400).json({ error: 'Cannot message yourself' });
  // find existing
  let convo = await prisma.conversation.findFirst({ where: { OR: [{ userAId: req.user.id, userBId: otherUserId }, { userAId: otherUserId, userBId: req.user.id }] } });
  if (!convo) {
    convo = await prisma.conversation.create({ data: { userAId: req.user.id, userBId: otherUserId } });
  }
  res.json({ convo });
});

router.get('/:id/messages', authRequired, async (req: AuthedRequest, res) => {
  const convo = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!convo) return res.status(404).json({ error: 'Not found' });
  if (convo.userAId !== req.user.id && convo.userBId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const messages = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: 'asc' } });
  res.json({ messages });
});

router.post('/:id/messages', authRequired, async (req: AuthedRequest, res) => {
  const convo = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!convo) return res.status(404).json({ error: 'Not found' });
  if (convo.userAId !== req.user.id && convo.userBId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { body } = req.body;
  const message = await prisma.message.create({ data: { conversationId: convo.id, senderId: req.user.id, body } });
  res.json({ message });
});

export default router;
