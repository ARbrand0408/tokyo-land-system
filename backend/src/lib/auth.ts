import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

// 認証ヘルパ - 外部依存を増やさず、Node 標準の crypto だけで実装する。
// パスワード: PBKDF2-SHA512 (210,000 iter), 16byte salt, 64byte hash。
// トークン: HS256 相当の HMAC-SHA256 で署名した JWT 形式 ({header}.{payload}.{sig})。

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(plain, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = pbkdf2Sync(plain, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export type JwtPayload = {
  sub: string;        // admin id
  email: string;
  name: string;
  role: string;
  iat: number;        // issued at (sec)
  exp: number;        // expiry (sec)
};

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET is not configured (must be at least 16 characters)');
  }
  return secret;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 時間

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = getSecret();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_TTL_SECONDS;
  const full: JwtPayload = { ...payload, iat, exp };
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(full));
  const data = `${header}.${body}`;
  const sig = b64url(createHmac('sha256', secret).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const secret = getSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expected = b64url(createHmac('sha256', secret).update(`${header}.${body}`).digest());
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as JwtPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
