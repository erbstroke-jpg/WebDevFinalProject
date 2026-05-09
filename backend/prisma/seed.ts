import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@test.com' },
    update: {},
    create: {
      email: 'alice@test.com',
      username: 'alice',
      password: passwordHash,
      displayName: 'Alice',
      bio: 'Hi, I am Alice 👋',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@test.com' },
    update: {},
    create: {
      email: 'bob@test.com',
      username: 'bob',
      password: passwordHash,
      displayName: 'Bob',
      bio: 'Bob here',
    },
  });

  console.log('Seeded users:', { alice: alice.username, bob: bob.username });
  console.log('Login: alice@test.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
