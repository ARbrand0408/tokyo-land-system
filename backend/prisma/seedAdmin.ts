import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth.js';

// 管理者(スタッフ)シード。
// `npm run db:seed:admin` で実行できる。既存ユーザーは更新する (upsert)。
//
// 環境変数で初期値を上書き可能:
//   SEED_ADMIN_EMAIL    (default: admin@tokyo-land.com)
//   SEED_ADMIN_PASSWORD (default: password123)
//   SEED_ADMIN_NAME     (default: 山田 雅人)

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@tokyo-land.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'password123';
  const name = process.env.SEED_ADMIN_NAME ?? '山田 雅人';

  const passwordHash = hashPassword(password);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name, role: 'admin' },
  });

  console.log(`Seeded admin: ${admin.email} (id=${admin.id})`);
  console.log(`  Login with: email="${email}" password="${password}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
