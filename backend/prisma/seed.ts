import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function newSlug() {
  return randomBytes(5).toString('base64url').slice(0, 8).toLowerCase();
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.proposalItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.property.deleteMany();

  console.log('Seeding properties...');
  const propertyA = await prisma.property.create({
    data: {
      name: 'パークコート南青山',
      propertyType: '賃貸マンション',
      area: '港区',
      address: '東京都港区南青山4-12-3',
      stations: [
        { line: '東京メトロ銀座線', station: '外苑前', walkMin: 5 },
        { line: '東京メトロ千代田線', station: '表参道', walkMin: 8 },
      ],
      highlights: [
        '南向き角部屋・採光良好',
        '24時間有人コンシェルジュ',
        '築浅・最上階プレミアム住戸',
      ],
      rooms: '2LDK',
      sizeSqm: 78.4,
      terraceSqm: 12.3,
      floor: 12,
      totalFloors: 14,
      basementFloors: 1,
      builtYearMonth: '2023-04',
      structure: 'RC造',
      totalUnits: 56,
      mainLight: '南',
      availableFrom: '即入居可',
      rent: 480000,
      maintenanceFee: 25000,
      deposit: '2ヶ月',
      keyMoney: '1ヶ月',
      brokerFee: '1ヶ月',
      renewalFee: '新賃料1ヶ月',
      contractTerm: '2年',
      cancelNotice: '2ヶ月前',
      insurance: '指定',
      guarantor: '指定保証会社利用',
      officeUse: '不可',
      sohoUse: '相談',
      pets: '相談',
      instruments: '不可',
      smoking: 'バルコニーのみ可',
      currentStatus: '空室',
      parking: '機械式・空き有り',
      parkingFee: '50,000円/月',
      description:
        '南青山の閑静な住宅街に位置するハイグレードレジデンス。眺望良好な最上階プレミアム住戸で、専用テラスから神宮の杜が一望できます。',
      facilities: ['コンシェルジュ', 'オートロック', '宅配ボックス', 'フィットネス', 'ラウンジ'],
      images: [],
      floorPlanUrl: null,
      status: '公開',
    },
  });

  const propertyB = await prisma.property.create({
    data: {
      name: '代官山テラスハウス',
      propertyType: '賃貸戸建て',
      area: '渋谷区',
      address: '東京都渋谷区代官山町8-1',
      stations: [{ line: '東急東横線', station: '代官山', walkMin: 6 }],
      highlights: ['メゾネット・専用ガーデン付き', 'ヒルサイドテラス徒歩圏'],
      rooms: '3LDK',
      sizeSqm: 105.6,
      terraceSqm: 18.0,
      floor: null,
      totalFloors: 3,
      builtYearMonth: '2018-11',
      structure: 'RC造',
      totalUnits: 4,
      mainLight: '南東',
      availableFrom: '2026-06-01',
      rent: 620000,
      maintenanceFee: 0,
      deposit: '3ヶ月',
      keyMoney: '1ヶ月',
      brokerFee: '1ヶ月',
      renewalFee: '新賃料1ヶ月',
      contractTerm: '2年',
      cancelNotice: '3ヶ月前',
      insurance: '指定',
      guarantor: '指定保証会社利用',
      pets: '可',
      smoking: '不可',
      parking: '平置き1台込み',
      parkingFee: '無料',
      description:
        'デザイナーズメゾネット。専用ガーデンとリビングが一体となった解放感のある住空間。',
      facilities: ['オートロック', 'ペット可', '駐車場', '車寄せ'],
      images: [],
      status: '公開',
    },
  });

  const propertyC = await prisma.property.create({
    data: {
      name: '麻布十番グランドタワー',
      propertyType: '売買マンション',
      area: '港区',
      address: '東京都港区麻布十番2-3-10',
      stations: [{ line: '都営大江戸線', station: '麻布十番', walkMin: 3 }],
      highlights: ['駅徒歩3分', '高層階・眺望良好', 'タワーマンション'],
      rooms: '3LDK',
      sizeSqm: 92.4,
      floor: 28,
      totalFloors: 32,
      builtYearMonth: '2020-03',
      structure: 'RC造',
      totalUnits: 200,
      mainLight: '南西',
      rent: null,
      maintenanceFee: 38000,
      description: 'タワーマンション高層階の南西角住戸。',
      facilities: ['コンシェルジュ', 'オートロック', '宅配ボックス', 'ゲストルーム', 'プール'],
      images: [],
      status: '公開',
    },
  });

  console.log('Seeding customers...');
  const customer = await prisma.customer.create({
    data: {
      name: '佐藤 健一',
      companyName: '株式会社サトウ商事',
      accessCode: '1042',
      email: 'sato.k@example.jp',
      phone: '090-1234-5678',
      moveInDate: '2026-07',
      birthDate: '1985-04-12',
      preferences: '駅徒歩10分以内 / 南向き / 築浅',
      notes: '内見は土日希望。',
    },
  });

  await prisma.customer.create({
    data: {
      name: '田中 美咲',
      companyName: null,
      accessCode: '4321',
      email: 'tanaka.m@example.jp',
      phone: '080-2345-6789',
      moveInDate: '2026-06',
      preferences: '渋谷・代官山周辺。ペット可。',
    },
  });

  console.log('Seeding proposals...');
  await prisma.proposal.create({
    data: {
      slug: newSlug(),
      customerId: customer.id,
      title: '港区エリア・厳選2物件のご提案',
      message:
        'いつもお世話になっております。\nご希望条件に合うお住まいを2件ご紹介いたします。ぜひご検討ください。',
      status: '送信済み',
      items: {
        create: [
          { propertyId: propertyA.id, order: 0 },
          { propertyId: propertyC.id, order: 1 },
        ],
      },
    },
  });

  await prisma.proposal.create({
    data: {
      slug: newSlug(),
      customerId: customer.id,
      title: '代官山エリアの戸建てもご検討ください',
      message: 'ペット可で広い物件もご用意してみました。',
      status: '下書き',
      items: {
        create: [{ propertyId: propertyB.id, order: 0 }],
      },
    },
  });

  const cCount = await prisma.customer.count();
  const pCount = await prisma.property.count();
  const propCount = await prisma.proposal.count();
  console.log(`Seeded ${cCount} customers, ${pCount} properties, ${propCount} proposals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
