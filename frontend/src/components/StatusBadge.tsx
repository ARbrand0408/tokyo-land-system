type Tone = 'terracotta' | 'forest' | 'emerald' | 'pine' | 'muted';

const toneClass: Record<Tone, string> = {
  terracotta: 'bg-accent-terracotta/12 text-accent-terracotta ring-accent-terracotta/30',
  forest: 'bg-accent-forest/12 text-accent-forest ring-accent-forest/30',
  emerald: 'bg-accent-emerald/12 text-accent-emerald ring-accent-emerald/30',
  pine: 'bg-accent-pine/12 text-accent-pine ring-accent-pine/30',
  muted: 'bg-ink-muted/12 text-ink-secondary ring-ink-muted/30',
};

type Props = {
  label: string;
  tone: Tone;
};

export function StatusBadge({ label, tone }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ring-inset',
        toneClass[tone],
      ].join(' ')}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export type { Tone };
