const PALETTE = [
  'bg-[#ffd8c2] text-[#8a3a12]',
  'bg-[#d6e9ff] text-[#1c4f8a]',
  'bg-[#e5dcff] text-[#4b2c9a]',
  'bg-[#d4f5e2] text-[#146040]',
  'bg-[#ffe7a6] text-[#7a5200]',
  'bg-[#ffd6e5] text-[#8f1f4c]',
  'bg-[#d3f1f4] text-[#135c63]',
];

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-sm', lg: 'size-11 text-base' };
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${PALETTE[hash(name) % PALETTE.length]}`}
    >
      {initials || '?'}
    </span>
  );
}
