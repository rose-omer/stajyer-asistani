import { useId, useRef, useState, type DragEvent } from 'react';
import { FileText, FileUp, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { MAX_CV_BYTES } from '../../lib/config';
import { formatBytes } from '../../lib/text';
import type { CvFile } from '../../types';

export function validateCv(file: File): string | null {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Yalnız PDF dosyası yükleyebilirsin.';
  }
  if (file.size > MAX_CV_BYTES) {
    return `Dosya ${formatBytes(file.size)}. En çok 5 MB olabilir.`;
  }
  if (file.size === 0) return 'Dosya boş görünüyor.';
  return null;
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

interface CvDropzoneProps {
  cv: CvFile | null;
  onChange: (cv: CvFile | null) => void;
}

export function CvDropzone({ cv, onChange }: CvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const id = useId();

  const accept = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateCv(file);
    setError(problem);
    if (problem) return;
    try {
      const base64 = await readBase64(file);
      onChange({ name: file.name, type: 'application/pdf', size: file.size, base64 });
    } catch {
      setError('Dosya okunamadı. Yeniden dene.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void accept(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-2 rounded-panel has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-accent">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-describedby={`${id}-help`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          void accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {cv ? (
        <div className="flex flex-wrap items-center gap-3 rounded-panel border border-line px-4 py-3">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-accent-text" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{cv.name}</p>
            <p className="text-sm text-ink-3">PDF, {formatBytes(cv.size)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Değiştir
          </Button>
          <button
            type="button"
            aria-label="CV dosyasını kaldır"
            onClick={() => onChange(null)}
            className="rounded-control p-2 text-ink-3 hover:bg-sunken hover:text-danger"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          data-dragging={dragging || undefined}
          className="flex flex-col items-start gap-3 rounded-panel border border-dashed border-line-strong/60 px-5 py-6 transition-colors duration-150 data-dragging:border-accent data-dragging:bg-accent-soft sm:flex-row sm:items-center"
        >
          <FileUp aria-hidden="true" className="size-6 shrink-0 text-ink-3" />
          <p className="flex-1 text-[0.9375rem] text-ink-2">
            PDF dosyanı buraya bırak ya da bilgisayarından seç.
          </p>
          <label
            htmlFor={id}
            className="inline-flex h-9 cursor-pointer items-center rounded-control border border-line-strong/50 bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-sunken"
          >
            Dosya seç
          </label>
        </div>
      )}
      {error ? (
        <p id={`${id}-help`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        <p id={`${id}-help`} className="text-sm text-ink-3">
          Yalnız PDF, en çok 5 MB.
        </p>
      )}
    </div>
  );
}
