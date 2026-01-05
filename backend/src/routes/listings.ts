import express from 'express';
import prisma from '../prisma';
import { authRequired, AuthedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { files: 5 } });

router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const { campus } = req.user;
  const { category, minPrice, maxPrice, freeOnly, under20, condition, q, sort, page = 1 } = req.query as any;
  const where: any = { campus };
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (freeOnly === 'true') where.price = 0;
  if (under20 === 'true') where.price = { lte: 20 };
  if (minPrice) where.price = { ...(where.price || {}), gte: Number(minPrice) };
  if (maxPrice) where.price = { ...(where.price || {}), lte: Number(maxPrice) };
  if (q) where.title = { contains: q, mode: 'insensitive' };
  const orderBy = sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'desc' };
  const listings = await prisma.listing.findMany({ where, include: { images: true, seller: true }, orderBy, take: 30, skip: (Number(page) - 1) * 30 });
  res.json({ listings });
});

router.post('/', authRequired, upload.array('images', 5), async (req: AuthedRequest, res) => {
  try {
    const { title, description, category, condition, price = 0, location, availableFrom, availableTo } = req.body as any;
    const images = (req.files as Express.Multer.File[] || []).map(f => ({ url: `/uploads/${path.basename(f.path)}` }));
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        category,
        condition,
        price: Number(price),
        location,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableTo: availableTo ? new Date(availableTo) : null,
        campus: req.user.campus,
        seller: { connect: { id: req.user.id } },
        images: { create: images }
      },
      include: { images: true }
    });
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ error: 'Could not create listing' });
  }
});

router.get('/:id', authRequired, async (req: AuthedRequest, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id }, include: { images: true, seller: true } });
  if (!listing || listing.campus !== req.user.campus) return res.status(404).json({ error: 'Not found' });
  res.json({ listing });
});

router.patch('/:id', authRequired, async (req: AuthedRequest, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Not owner' });
  const data: any = {};
  const { title, description, price, isSold, condition, location } = req.body;
  if (title) data.title = title;
  if (description) data.description = description;
  if (price !== undefined) data.price = Number(price);
  if (isSold !== undefined) data.isSold = isSold === 'true' || isSold === true;
  if (condition) data.condition = condition;
  if (location) data.location = location;
  const updated = await prisma.listing.update({ where: { id: req.params.id }, data });
  res.json({ listing: updated });
});

router.delete('/:id', authRequired, async (req: AuthedRequest, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Not owner' });
  await prisma.listing.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/:id/status', authRequired, async (req: AuthedRequest, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Not owner' });
  const { isSold } = req.body;
  const updated = await prisma.listing.update({ where: { id: req.params.id }, data: { isSold: !!isSold } });
  res.json({ listing: updated });
});

export default router;
