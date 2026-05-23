import { PrismaClient } from '@prisma/client';

// 管理者の表示名 / email を更新するワンショット用スクリプト。
// パスワードや role は変更しないので「seedAdmin の upsert」より安全。
//
// 使い方 (name のみ更新):
//   ADMIN_EMAIL="admin@tokyo-land.com" ADMIN_NEW_NAME="【管理者】" \
//     npm run db:update:admin-name
//
// 使い方 (email も同時に変更したい場合):
//   ADMIN_EMAIL="admin@tokyo-land.com" \
//     ADMIN_NEW_EMAIL="arbrand@tokyo-land.net" \
//     ADMIN_NEW_NAME="【管理者】" \
//     npm run db:update:admin-name
//
// ADMIN_EMAIL / ADMIN_NEW_NAME は必須、ADMIN_NEW_EMAIL は任意。
// 環境変数が無い場合はエラーで停止する (誤って全件更新しないため)。

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const newName = process.env.ADMIN_NEW_NAME;
  const newEmail = process.env.ADMIN_NEW_EMAIL?.toLowerCase();

  if (!email) {
    throw new Error('ADMIN_EMAIL is required');
  }
  if (!newName) {
    throw new Error('ADMIN_NEW_NAME is required');
  }

  const before = await prisma.admin.findUnique({ where: { email } });
  if (!before) {
    throw new Error(`Admin not found for email: ${email}`);
  }
  console.log(`Before: id=${before.id} email=${before.email} name="${before.name}"`);

  // newEmail 指定時は重複チェック (UNIQUE 制約違反を未然に避ける)
  if (newEmail && newEmail !== email) {
    const conflict = await prisma.admin.findUnique({ where: { email: newEmail } });
    if (conflict) {
      throw new Error(`ADMIN_NEW_EMAIL "${newEmail}" is already used by id=${conflict.id}`);
    }
  }

  const data: { name: string; email?: string } = { name: newName };
  if (newEmail) data.email = newEmail;

  const after = await prisma.admin.update({
    where: { email },
    data,
  });
  console.log(`After : id=${after.id} email=${after.email} name="${after.name}"`);
  console.log('passwordHash / role は変更していません。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
