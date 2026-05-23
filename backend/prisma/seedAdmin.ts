import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth.js';

// 管理者(スタッフ)シード。
// `npm run db:seed:admin` で実行できる。既存ユーザーは更新する (upsert)。
//
// 環境変数で値を上書き可能:
//   SEED_ADMIN_EMAIL    (default: arbrand@tokyo-land.net)
//   SEED_ADMIN_NAME     (default: 【管理者】)
//   SEED_ADMIN_PASSWORD (デフォルト無し・必須)
//
// password はデフォルトを設けていない。誤って引数なしで実行したときに
// 既存の管理者アカウントのパスワードが意図せず弱いデフォルト値に
// リセットされる事故を防ぐため。新規セットアップ時も明示的に与えること。

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'arbrand@tokyo-land.net').toLowerCase();
  const name = process.env.SEED_ADMIN_NAME ?? '【管理者】';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required. ' +
        'Re-running without an explicit password would overwrite the existing password. ' +
        'Set SEED_ADMIN_PASSWORD env var and try again.',
    );
  }

  const passwordHash = hashPassword(password);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name, role: 'admin' },
  });

  console.log(`Seeded admin: ${admin.email} (id=${admin.id}) name="${admin.name}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
