import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth routes (smoke)', () => {
  it('rejects non .edu emails', async () => {
    const res = await request(app).post('/auth/signup').send({ email: 'user@gmail.com', campus: 'X' });
    expect(res.status).toBe(400);
  });
});
