export function formatYen(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 100_000_000) {
    const oku = value / 100_000_000;
    return `¥${oku.toFixed(oku >= 10 ? 1 : 2)}億`;
  }
  if (value >= 10_000) {
    const man = Math.round(value / 10_000);
    return `¥${man.toLocaleString('ja-JP')}万`;
  }
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function formatRent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'たった今';
  if (diff < 60 * 60) return `${Math.floor(diff / 60)}分前`;
  if (diff < 60 * 60 * 24) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 60 * 60 * 24 * 7) return `${Math.floor(diff / (3600 * 24))}日前`;
  return formatDate(iso);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
