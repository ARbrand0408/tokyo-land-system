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
  highlights?: string[];
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

// Normalize: convert full-width digits/letters/space, squash inline whitespace
// while preserving line breaks (line structure is a useful signal for table-
// based マイソク layouts).
function normalize(text: string): string {
  return text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[ａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n');
}

function parseInteger(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function parseManToYen(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 10000) : undefined;
}

// マイソク表組みは label と value が改行で分離されやすい。
// `LABEL <whitespace incl. up to ~3 lines> VALUE` を1パターンで吸収する
// よう、ラベル直後を非貪欲な `[\s\S]{0,N}?` で許容する。
function labelGap(maxChars = 80): string {
  return `[\\s\\S]{0,${maxChars}}?`;
}

function matchFirst(text: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m;
  }
  return null;
}

// 物件名や物件のポイントなどで誤って拾ってしまいやすい「ラベル語」
const LABEL_KEYWORDS = /^(所在地|住所|交通|アクセス|賃料|価格|管理費|共益費|間取り|間取|専有面積|面積|築年月|完成|竣工|構造|敷金|礼金|保証金|仲介手数料|更新料|契約期間|物件名|建物名|名称|マンション名|物件のポイント|セールスポイント|特徴|ポイント)/;

function looksLikeLabel(v: string): boolean {
  return LABEL_KEYWORDS.test(v.trim());
}

// --- 物件名 -----------------------------------------------------------------
function extractName(text: string): string | undefined {
  const labels = ['物件名称', '物件名', '建物名称', '建物名', 'マンション名', '名称'];
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:：]?\\s*([^\\n\\r]{2,60})`);
    const m = text.match(re);
    const v = m?.[1]?.trim();
    if (v && !looksLikeLabel(v)) return v.slice(0, 80);
  }
  // ラベルと値が改行で分離されているケース: ラベル行の直後の意味ある行
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*\\n+\\s*([^\\n\\r]{2,60})`);
    const m = text.match(re);
    const v = m?.[1]?.trim();
    if (v && !looksLikeLabel(v) && !/^(東京都|〒|\d)/.test(v)) return v.slice(0, 80);
  }
  // フォールバック: テキスト先頭付近の意味ある行（住所/数値/長すぎる行は除外）
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (line.length < 4 || line.length > 40) continue;
    if (/^(東京都|〒|物件|所在地|住所|賃料|価格|間取|専有面積|管理費|交通|アクセス|築|完成)/.test(line)) continue;
    if (/^[\d\s,円万％%]+$/.test(line)) continue;
    return line.slice(0, 80);
  }
  return undefined;
}

// --- 所在地 -----------------------------------------------------------------
function extractAddress(text: string): string | undefined {
  const m = matchFirst(text, [
    new RegExp(`(?:所在地|住所)\\s*[:：]?${labelGap(40)}(東京都[^\\s\\n\\r、,]{3,40})`),
    /(東京都[^\s\n\r、,]{3,40})/,
  ]);
  return m?.[1]?.trim();
}

function extractArea(address: string | undefined): string | undefined {
  if (!address) return undefined;
  return TOKYO_23.find((w) => address.includes(w));
}

// --- 間取り / 面積 ----------------------------------------------------------
function extractRooms(text: string): string | undefined {
  const m = matchFirst(text, [
    new RegExp(`(?:間取り|間取)\\s*[:：]?${labelGap(40)}(\\d{1,2}\\s*S?LDK|\\d{1,2}\\s*S?DK|\\d{1,2}\\s*K|\\d{1,2}\\s*R|ワンルーム|1R)`),
    /(\d{1,2}\s*S?LDK|\d{1,2}\s*S?DK|ワンルーム|1R)/,
  ]);
  return m?.[1]?.replace(/\s+/g, '');
}

function extractSizeSqm(text: string): number | undefined {
  const m = matchFirst(text, [
    new RegExp(`(?:専有面積|面積)\\s*[:：]?${labelGap(40)}([\\d.]+)\\s*(?:㎡|m2|m²|平米)`),
    /([\d.]+)\s*(?:㎡|m2|m²|平米)/,
  ]);
  const raw = m?.[1];
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 5 && n < 10000 ? n : undefined;
}

// --- 階数 -------------------------------------------------------------------
function extractFloors(text: string): { floor?: number; totalFloors?: number } {
  const result: { floor?: number; totalFloors?: number } = {};
  const totalMatch = text.match(/(?:地上)?\s*(\d{1,3})\s*階建/);
  if (totalMatch?.[1]) result.totalFloors = parseInteger(totalMatch[1]);
  const floorMatch =
    text.match(/(?:所在階|階数)\s*[:：]?[\s\S]{0,40}?(\d{1,3})\s*階/) ??
    text.match(/(\d{1,3})\s*階\s*\/\s*\d{1,3}\s*階建/); // "12階 / 25階建" 形式
  if (floorMatch?.[1]) result.floor = parseInteger(floorMatch[1]);
  return result;
}

// --- 築年月 -----------------------------------------------------------------
function extractBuiltYearMonth(text: string): string | undefined {
  const labels = ['築年月', '完成年月', '完成', '竣工年月', '竣工', '建築年月日', '建築年月', '新築年月', '築'];
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:：]?${labelGap(40)}(\\d{4})\\s*[年./\\-]\\s*(\\d{1,2})\\s*[月]?`);
    const m = text.match(re);
    const y = m?.[1];
    const mo = m?.[2];
    if (y && mo) {
      const monthNum = parseInteger(mo);
      if (!monthNum || monthNum < 1 || monthNum > 12) continue;
      return `${y}-${String(monthNum).padStart(2, '0')}`;
    }
  }
  // 「YYYY年MM月築」のような語尾型
  const tail = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(?:築|竣工|完成)/);
  if (tail?.[1] && tail[2]) {
    const monthNum = parseInteger(tail[2]);
    if (monthNum && monthNum >= 1 && monthNum <= 12) {
      return `${tail[1]}-${String(monthNum).padStart(2, '0')}`;
    }
  }
  return undefined;
}

// --- 構造 -------------------------------------------------------------------
function extractStructure(text: string): string | undefined {
  const m = text.match(/(鉄骨鉄筋コンクリート造|鉄筋コンクリート造|SRC造|RC造|鉄骨造|木造|S造)/);
  return m?.[1];
}

// --- 金額（円表記 + 万円表記）---------------------------------------------
function extractMoney(text: string, labels: string[]): number | undefined {
  for (const label of labels) {
    // 「LABEL ... \d+万円」を優先（マイソクで多い表記）
    const manRe = new RegExp(`${label}\\s*[:：]?${labelGap(60)}([\\d,]+(?:\\.\\d+)?)\\s*万円`);
    const manMatch = text.match(manRe);
    if (manMatch?.[1]) {
      const n = parseManToYen(manMatch[1]);
      if (n != null) return n;
    }
    // 「LABEL ... \d+円」
    const yenRe = new RegExp(`${label}\\s*[:：]?${labelGap(60)}([\\d,]{2,})\\s*円`);
    const yenMatch = text.match(yenRe);
    if (yenMatch?.[1]) {
      const n = parseInteger(yenMatch[1]);
      if (n != null) return n;
    }
    // 「LABEL ... \d{4,}」(円記号無しでも妥当な範囲ならOK)
    const numRe = new RegExp(`${label}\\s*[:：]?${labelGap(60)}([\\d,]{4,})(?!\\s*年)`);
    const numMatch = text.match(numRe);
    if (numMatch?.[1]) {
      const n = parseInteger(numMatch[1]);
      if (n != null && n >= 1000) return n;
    }
  }
  return undefined;
}

// --- 敷金/礼金などのテキスト値 ----------------------------------------------
function extractTextLabel(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:：]?${labelGap(60)}([^\\n\\r、,]{1,30})`);
    const m = text.match(re);
    const raw = m?.[1];
    if (!raw) continue;
    const v = raw.trim();
    if (v && v !== '-' && v !== '－' && !/^[:：\s]/.test(v)) return v;
  }
  return undefined;
}

// 「敷/礼 2/1ヶ月」「敷金/礼金 2/1ヶ月」形式の結合表記を分解
function extractDepositKeyMoneyCombined(text: string): { deposit?: string; keyMoney?: string } {
  const re = /敷金?\s*[\/／・]\s*礼金?\s*[:：]?\s*([0-9.]+)\s*[\/／・]\s*([0-9.]+)\s*(ヶ月|か月|ケ月|月|円|万円)/;
  const m = text.match(re);
  if (!m) return {};
  const unit = m[3] ?? 'ヶ月';
  return {
    deposit: m[1] ? `${m[1]}${unit}` : undefined,
    keyMoney: m[2] ? `${m[2]}${unit}` : undefined,
  };
}

// --- 駅情報 -----------------------------------------------------------------
function extractStations(text: string): Station[] {
  const stations: Station[] = [];
  const seen = new Set<string>();
  const push = (line: string, station: string, walkMinRaw: string) => {
    const walkMin = parseInteger(walkMinRaw);
    if (walkMin == null || walkMin < 0 || walkMin > 60) return;
    const l = line.trim().slice(0, 25);
    const s = station.trim().replace(/駅$/, '').slice(0, 20);
    if (!l || !s) return;
    const key = `${l}|${s}|${walkMin}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (stations.length < 5) stations.push({ line: l, station: s, walkMin });
  };

  // パターン2 を先に: 「○○駅 (○○線) 徒歩○分」括弧書きを優先処理（パターン1の誤マッチを防ぐ）
  const re2 = /([^\s\n、,（）()「」]{1,15})駅\s*[（(]([^）)]{2,25}線)[）)]\s*徒歩\s*(\d{1,2})\s*分/g;
  for (const m of text.matchAll(re2)) {
    if (m[1] && m[2] && m[3]) push(m[2], m[1], m[3]);
  }

  // パターン1: 「○○線 ○○駅 徒歩○分」 (改行も許容)
  // station の文字クラスから全角閉じ括弧 ）も除外
  const re1 = /([^\s\n、,（）()]{2,20}線)[\s\n]*[「『]?([^\s\n、,「」『』（）()]{1,15})駅?[」』]?[\s\n]*(?:から)?[\s\n]*徒歩[\s\n]*(\d{1,2})\s*分/g;
  for (const m of text.matchAll(re1)) {
    if (m[1] && m[2] && m[3]) push(m[1], m[2], m[3]);
  }

  // パターン3: 「○○駅 徒歩○分」(路線情報なし) — 路線は空文字
  if (stations.length === 0) {
    const re3 = /([^\s\n、,（）()「」]{2,15})駅\s*徒歩\s*(\d{1,2})\s*分/g;
    for (const m of text.matchAll(re3)) {
      if (m[1] && m[2]) push('', m[1], m[2]);
    }
  }

  return stations;
}

// --- 物件のポイント（highlights） ------------------------------------------
function extractHighlights(text: string): string[] {
  const labelRe = /(物件のポイント|セールスポイント|おすすめポイント|物件特徴|物件の特徴|アピールポイント|ポイント|特徴)\s*[:：]?\s*\n?/;
  const match = labelRe.exec(text);
  if (!match) return [];
  const start = match.index + match[0].length;
  // ラベル以降500文字までを切り出し
  const region = text.slice(start, start + 600);
  // 箇条書きトークン: ・ ● ○ ■ □ ◆ ◇ ▼ ▲ - * ＊ または 1. 2. ①②...
  const bulletRe = /(?:^|\n)\s*[・●○■□◆◇▼▲＊*\-•]\s*([^\n\r]{3,80})/g;
  const numberRe = /(?:^|\n)\s*[①-⑳1-9]\d?[\.\)）、]\s*([^\n\r]{3,80})/g;
  const items: string[] = [];
  const seen = new Set<string>();
  const add = (v: string) => {
    const t = v.trim().replace(/[。\s]+$/, '');
    if (!t || seen.has(t)) return;
    if (/^(物件名|所在地|賃料|管理費|敷金|礼金|間取|専有面積|交通|アクセス|築|完成)/.test(t)) return;
    seen.add(t);
    if (items.length < 8) items.push(t);
  };
  for (const m of region.matchAll(bulletRe)) {
    if (m[1]) add(m[1]);
  }
  for (const m of region.matchAll(numberRe)) {
    if (m[1]) add(m[1]);
  }
  // フォールバック: 箇条書き記号が無い場合は改行ベースで短い行を拾う
  if (items.length === 0) {
    for (const line of region.split('\n').slice(0, 10)) {
      const t = line.trim();
      if (t.length < 6 || t.length > 60) continue;
      if (/[:：]/.test(t)) continue; // ラベル行を除外
      add(t);
      if (items.length >= 5) break;
    }
  }
  return items;
}

// ---------------------------------------------------------------------------

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
  const rent = extractMoney(text, ['賃料', '月額賃料', '家賃', '価格']);
  const maintenanceFee = extractMoney(text, ['管理費', '共益費']);
  const combined = extractDepositKeyMoneyCombined(text);
  const deposit = combined.deposit ?? extractTextLabel(text, ['敷金', '保証金']);
  const keyMoney = combined.keyMoney ?? extractTextLabel(text, ['礼金']);
  const brokerFee = extractTextLabel(text, ['仲介手数料']);
  const renewalFee = extractTextLabel(text, ['更新料']);
  const contractTerm = extractTextLabel(text, ['契約期間']);
  const stations = extractStations(text);
  const highlights = extractHighlights(text);

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
  setField('highlights', highlights);

  return { extracted, matchedFields: matched, rawText };
}
