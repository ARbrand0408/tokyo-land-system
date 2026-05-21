import { extractText, getDocumentProxy } from 'unpdf';

export type Station = { line: string; station: string; walkMin: number };

export type ExtractedProperty = {
  name?: string;
  address?: string;
  area?: string;
  rooms?: string;
  sizeSqm?: number;
  floor?: number;
  totalFloors?: number;
  builtYearMonth?: string;
  structure?: string;
  rent?: number;
  maintenanceFee?: number;
  deposit?: string;
  keyMoney?: string;
  brokerFee?: string;
  renewalFee?: string;
  contractTerm?: string;
  stations?: Station[];
};

export type ExtractionResult = {
  extracted: ExtractedProperty;
  matchedFields: string[];
  rawText: string;
};

const TOKYO_23 = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区',
  '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区',
  '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区',
  '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区',
];

export async function extractTextFromPdf(buffer: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join('\n') : text;
}

// Normalize full-width digits / spaces and squash runs of whitespace so the
// regex patterns below can be written against a predictable shape.
function normalize(text: string): string {
  return text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[ａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

function parseInteger(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function matchFirst(text: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m;
  }
  return null;
}

function extractName(text: string): string | undefined {
  const m = matchFirst(text, [
    /(?:物件名|建物名|マンション名|物件名称)\s*[:：]?\s*([^\n\r]+?)(?:\s{2,}|$|\n)/,
  ]);
  const v = m?.[1];
  if (v) return v.trim().slice(0, 80);
  return undefined;
}

function extractAddress(text: string): string | undefined {
  const m = matchFirst(text, [
    /(?:所在地|住所)\s*[:：]?\s*(東京都[^\s\n\r、,]+)/,
    /(東京都[^\s\n\r、,]{3,40})/,
  ]);
  return m?.[1]?.trim();
}

function extractArea(address: string | undefined): string | undefined {
  if (!address) return undefined;
  return TOKYO_23.find((w) => address.includes(w));
}

function extractRooms(text: string): string | undefined {
  const m = matchFirst(text, [
    /(?:間取り|間取)\s*[:：]?\s*(\d{1,2}\s*S?LDK|\d{1,2}\s*S?DK|\d{1,2}\s*K|\d{1,2}\s*R|ワンルーム|1R)/,
    /(\d{1,2}\s*S?LDK|\d{1,2}\s*S?DK)/,
  ]);
  return m?.[1]?.replace(/\s+/g, '');
}

function extractSizeSqm(text: string): number | undefined {
  const m = matchFirst(text, [
    /(?:専有面積|面積)\s*[:：]?\s*([\d.]+)\s*(?:㎡|m2|m²|平米)/,
    /([\d.]+)\s*(?:㎡|m2|m²|平米)/,
  ]);
  const raw = m?.[1];
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function extractFloors(text: string): { floor?: number; totalFloors?: number } {
  const result: { floor?: number; totalFloors?: number } = {};
  const totalMatch = text.match(/(?:地上)?\s*(\d{1,3})\s*階建/);
  if (totalMatch?.[1]) result.totalFloors = parseInteger(totalMatch[1]);
  const floorMatch = text.match(/(?:所在階|階数)\s*[:：]?\s*(\d{1,3})\s*階/);
  if (floorMatch?.[1]) result.floor = parseInteger(floorMatch[1]);
  return result;
}

function extractBuiltYearMonth(text: string): string | undefined {
  const m = matchFirst(text, [
    /(?:築年月|竣工|建築年月日?)\s*[:：]?\s*(\d{4})\s*年\s*(\d{1,2})\s*月/,
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*築/,
  ]);
  const y = m?.[1];
  const mo = m?.[2];
  if (y && mo) return `${y}-${mo.padStart(2, '0')}`;
  return undefined;
}

function extractStructure(text: string): string | undefined {
  const m = text.match(/(鉄骨鉄筋コンクリート造|鉄筋コンクリート造|SRC造|RC造|鉄骨造|木造|S造)/);
  return m?.[1];
}

function extractMoney(text: string, labels: string[]): number | undefined {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:：]?\\s*([\\d,]+)\\s*(?:円|万円)?`);
    const m = text.match(re);
    const raw = m?.[1];
    if (!raw) continue;
    const n = parseInteger(raw);
    if (n == null) continue;
    return /万円/.test(m[0]) ? n * 10000 : n;
  }
  return undefined;
}

function extractTextLabel(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:：]?\\s*([^\\n\\r、,]{1,30})`);
    const m = text.match(re);
    const raw = m?.[1];
    if (!raw) continue;
    const v = raw.trim();
    if (v && v !== '-') return v;
  }
  return undefined;
}

function extractStations(text: string): Station[] {
  const stations: Station[] = [];
  const re = /([^\s\n、,（(]{2,15}線)\s*[「「]?([^\s\n、,「」（()]{1,10})駅?[」」]?\s*(?:から)?\s*徒歩\s*(\d{1,2})\s*分/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(text)) !== null) {
    const lineRaw = m[1];
    const stationRaw = m[2];
    const walkRaw = m[3];
    if (!lineRaw || !stationRaw || !walkRaw) continue;
    const walkMin = parseInteger(walkRaw);
    if (walkMin == null) continue;
    const line = lineRaw.trim();
    const station = stationRaw.trim().replace(/駅$/, '');
    const key = `${line}|${station}|${walkMin}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stations.push({ line, station, walkMin });
    if (stations.length >= 5) break;
  }
  return stations;
}

export function parseExtractedText(rawText: string): ExtractionResult {
  const text = normalize(rawText);

  const name = extractName(text);
  const address = extractAddress(text);
  const area = extractArea(address);
  const rooms = extractRooms(text);
  const sizeSqm = extractSizeSqm(text);
  const { floor, totalFloors } = extractFloors(text);
  const builtYearMonth = extractBuiltYearMonth(text);
  const structure = extractStructure(text);
  const rent = extractMoney(text, ['賃料', '月額賃料', '家賃']);
  const maintenanceFee = extractMoney(text, ['管理費', '共益費']);
  const deposit = extractTextLabel(text, ['敷金']);
  const keyMoney = extractTextLabel(text, ['礼金']);
  const brokerFee = extractTextLabel(text, ['仲介手数料']);
  const renewalFee = extractTextLabel(text, ['更新料']);
  const contractTerm = extractTextLabel(text, ['契約期間']);
  const stations = extractStations(text);

  const extracted: ExtractedProperty = {};
  const matched: string[] = [];

  const setField = <K extends keyof ExtractedProperty>(k: K, v: ExtractedProperty[K] | undefined) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v) && v.length === 0) return;
    extracted[k] = v;
    matched.push(k);
  };

  setField('name', name);
  setField('address', address);
  setField('area', area);
  setField('rooms', rooms);
  setField('sizeSqm', sizeSqm);
  setField('floor', floor);
  setField('totalFloors', totalFloors);
  setField('builtYearMonth', builtYearMonth);
  setField('structure', structure);
  setField('rent', rent);
  setField('maintenanceFee', maintenanceFee);
  setField('deposit', deposit);
  setField('keyMoney', keyMoney);
  setField('brokerFee', brokerFee);
  setField('renewalFee', renewalFee);
  setField('contractTerm', contractTerm);
  setField('stations', stations);

  return { extracted, matchedFields: matched, rawText };
}
