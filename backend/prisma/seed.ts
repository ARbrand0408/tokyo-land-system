import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.customer.deleteMany();
  await prisma.property.deleteMany();

  console.log('Seeding customers...');
  await prisma.customer.createMany({
    data: [
      {
        code: 'C-1042',
        name: '佐藤 健一',
        nameKana: 'サトウ ケンイチ',
        phone: '090-1234-5678',
        email: 'sato.k@example.jp',
        assignedTo: '山田 雅人',
        status: '商談中',
        desiredArea: '世田谷区',
        desiredRooms: '3LDK',
        budgetMin: 70000000,
        budgetMax: 90000000,
        notes: '駅徒歩10分以内希望。築浅優先。',
        lastContactedAt: new Date('2026-05-18T10:30:00Z'),
      },
      {
        code: 'C-1043',
        name: '田中 美咲',
        nameKana: 'タナカ ミサキ',
        phone: '080-2345-6789',
        email: 'tanaka.m@example.jp',
        assignedTo: '鈴木 千夏',
        status: '内見予定',
        desiredArea: '目黒区',
        desiredRooms: '2LDK',
        budgetMin: 50000000,
        budgetMax: 65000000,
        notes: '5月22日内見予約済み。',
        lastContactedAt: new Date('2026-05-19T15:00:00Z'),
      },
      {
        code: 'C-1044',
        name: '高橋 翔',
        nameKana: 'タカハシ ショウ',
        phone: '070-3456-7890',
        email: 'takahashi.s@example.jp',
        assignedTo: '山田 雅人',
        status: '契約準備',
        desiredArea: '港区',
        desiredRooms: '3LDK',
        budgetMin: 100000000,
        budgetMax: 130000000,
        notes: '住宅ローン審査中。',
        lastContactedAt: new Date('2026-05-17T09:15:00Z'),
      },
    ],
  });

  console.log('Seeding properties...');
  await prisma.property.createMany({
    data: [
      {
        code: 'P-2301',
        name: '南青山レジデンス',
        area: '港区',
        address: '東京都港区南青山4-12-3',
        type: '新築マンション',
        rooms: '3LDK',
        sizeSqm: 92.4,
        price: 185000000,
        builtYear: 2026,
        vacancy: '空室',
        status: '公開中',
        description: '南青山の閑静な住宅街に位置する新築レジデンス。',
      },
      {
        code: 'P-2302',
        name: '代官山ヒルサイドテラス',
        area: '渋谷区',
        address: '東京都渋谷区代官山町8-1',
        type: '中古マンション',
        rooms: '2LDK',
        sizeSqm: 78.2,
        price: 98000000,
        builtYear: 2014,
        vacancy: '申込中',
        status: '商談中',
        description: '代官山駅徒歩5分。リノベーション済み。',
      },
      {
        code: 'P-2303',
        name: '世田谷桜邸',
        area: '世田谷区',
        address: '東京都世田谷区桜新町2-5-7',
        type: '一戸建て',
        rooms: '4LDK',
        sizeSqm: 145.8,
        price: 120000000,
        builtYear: 2022,
        vacancy: '空室',
        status: '公開中',
        description: '桜新町駅徒歩8分。南向き角地。',
      },
    ],
  });

  const cCount = await prisma.customer.count();
  const pCount = await prisma.property.count();
  console.log(`Seeded ${cCount} customers, ${pCount} properties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
