import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Found ${admins.length} admin(s):`);
  for (const a of admins) {
    console.log(`  - id=${a.id} email=${a.email} name="${a.name}" role=${a.role}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
