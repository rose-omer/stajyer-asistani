import { BriefcaseBusiness } from 'lucide-react';

/** Ürün işareti: düz vurgu karesi + ad. Kenar çubuğunda ve giriş ekranlarında aynı. */
export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'size-7' : 'size-9';
  const icon = size === 'sm' ? 'size-4' : 'size-5';
  return (
    <span
      aria-hidden="true"
      className={`grid ${box} shrink-0 place-items-center rounded-control bg-accent text-accent-ink`}
    >
      <BriefcaseBusiness className={icon} strokeWidth={2} />
    </span>
  );
}

/** Giriş ve onay ekranlarının başlığı. */
export function BrandHeader() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
        Stajyer Asistanı
      </span>
    </div>
  );
}
