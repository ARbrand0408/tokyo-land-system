// Format a yen amount as a Japanese-style abbreviated string.
// 100,000,000 -> "¥1.0億"  /  85,000,000 -> "¥8,500万"  /  null -> "—"
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

export function formatBudgetRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `${formatYen(min)} 〜 ${formatYen(max)}`;
  if (max != null) return `〜 ${formatYen(max)}`;
  return `${formatYen(min)} 〜`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}
