import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import listingRoutes from './routes/listings';
import convoRoutes from './routes/conversations';
import prisma from './prisma';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/listings', listingRoutes);
app.use('/conversations', convoRoutes);

const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('join', (room) => socket.join(room));
  socket.on('message', async (payload) => {
    // payload: { conversationId, senderId, body }
    const msg = await prisma.message.create({ data: { conversationId: payload.conversationId, senderId: payload.senderId, body: payload.body } });
    io.to(payload.conversationId).emit('message', msg);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Backend running on ${port}`));
