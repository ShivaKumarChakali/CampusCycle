import prisma from '../src/prisma';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('Seeding...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({ data: { email: 'alice@university.edu', name: 'Alice', campus: 'StateU', isVerified: true } });
  const bob = await prisma.user.create({ data: { email: 'bob@university.edu', name: 'Bob', campus: 'StateU', isVerified: true } });

  const l1 = await prisma.listing.create({ data: {
    title: 'Calculus Textbook', description: 'Used but good.', category: 'textbooks', condition: 'good', price: 15, campus: 'StateU', seller: { connect: { id: alice.id } }, images: { create: [{ url: '/uploads/sample-book.jpg' }] }
  } });

  const convo = await prisma.conversation.create({ data: { userAId: alice.id, userBId: bob.id } });
  await prisma.message.create({ data: { conversationId: convo.id, senderId: bob.id, body: 'Is the textbook still available?' } });

  console.log('Seeding complete');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
