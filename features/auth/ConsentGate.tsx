import { useId, useRef, useState, type ReactNode } from 'react';
import { BrandHeader } from '../../components/Brand';
import { Button } from '../../components/Button';
import { KEYS, readString, writeString } from '../../lib/storage';

export function hasConsent(): boolean {
  return readString(KEYS.consent) !== null;
}

export function revokeConsent(): void {
  writeString(KEYS.consent, null);
}

/** KVKK aydınlatması ve ücretsiz katman uyarısı. Onay olmadan uygulama açılmaz. */
export function ConsentGate({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(hasConsent);
  const [checked, setChecked] = useState(false);
  const [showError, setShowError] = useState(false);
  const checkRef = useRef<HTMLInputElement>(null);
  const checkId = useId();
  const errorId = useId();
  const titleId = useId();

  if (accepted) return <>{children}</>;

  const invalid = showError && !checked;

  // Düğme pasif değil: pasif düğme odak almaz ve nedenini söylemez.
  // Onay yoksa hata metni çıkar ve odak kutuya gider.
  const submit = () => {
    if (!checked) {
      setShowError(true);
      checkRef.current?.focus();
      return;
    }
    writeString(KEYS.consent, new Date().toISOString());
    setAccepted(true);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
        <BrandHeader />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-col px-4 py-10 sm:px-6 sm:py-16">
        <section
          aria-labelledby={titleId}
          className="flex flex-col gap-6 rounded-panel border border-line bg-surface p-6 sm:p-8"
        >
          <div className="flex flex-col gap-2">
            <h1 id={titleId} className="text-2xl font-bold tracking-[-0.015em]">
              Başlamadan önce
            </h1>
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">
              Bu uygulama özgeçmişini ve profil bilgilerini mail taslağı yazmak için Google
              Gemini’ye gönderir. Özgeçmiş kişisel veridir.
            </p>
          </div>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-2 marker:text-ink-3">
            <li>
              Gemini’nin ücretsiz katmanında gönderilen içerik Google tarafından ürün iyileştirme
              için kullanılabilir. Hassas bilgi içeren bir özgeçmiş yükleme.
            </li>
            <li>
              Hiçbir mail onayın olmadan gönderilmez. Her gönderimden önce alıcıyı ve metni
              görürsün.
            </li>
            <li>Günlük gönderim sınırı vardır. Toplu ve istenmeyen mail gönderme.</li>
            <li>Verilerini Ayarlar sayfasından istediğin zaman silebilirsin.</li>
          </ul>
          <div className="flex flex-col gap-2">
            <div
              className={`flex items-start gap-3 rounded-control border px-4 py-3 transition-colors duration-150 ${
                invalid ? 'border-danger bg-danger-soft' : 'border-line bg-sunken'
              }`}
            >
              <input
                ref={checkRef}
                id={checkId}
                type="checkbox"
                checked={checked}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 size-4 shrink-0"
              />
              <label htmlFor={checkId} className="text-[0.9375rem] leading-relaxed text-ink">
                Aydınlatma metnini okudum; verilerimin bu amaçla işlenmesini onaylıyorum.
              </label>
            </div>
            {invalid && (
              <p id={errorId} role="alert" className="text-sm text-danger">
                Devam etmek için onay kutusunu işaretle.
              </p>
            )}
          </div>
          <Button className="w-full sm:w-fit" onClick={submit}>
            Onayla ve devam et
          </Button>
        </section>
      </main>
    </div>
  );
}
