import { Mail } from 'lucide-react';

/** Ürün işareti: mürekkep mavisi zarf. Üst çubukta ve giriş ekranlarında aynı. */
export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <Mail
      aria-hidden="true"
      className={`${size === 'sm' ? 'size-6' : 'size-7'} shrink-0 text-accent`}
    />
  );
}

/** Giriş ve onay ekranlarının başlığı. */
export function BrandHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
        Stajyer Asistanı
      </span>
    </div>
  );
}
