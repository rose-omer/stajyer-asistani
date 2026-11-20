import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

function Harness({ busy = false, onCancel = () => {} }: { busy?: boolean; onCancel?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Aç
      </button>
      <ConfirmDialog
        open={open}
        title="Mail gönderilsin mi?"
        confirmLabel="Gönder"
        busy={busy}
        onConfirm={() => setOpen(false)}
        onCancel={() => {
          onCancel();
          setOpen(false);
        }}
      >
        <p>Geri alınamaz.</p>
      </ConfirmDialog>
    </>
  );
}

const dialog = () => screen.getByRole('dialog', { hidden: true });

describe('ConfirmDialog', () => {
  it('başlık ve açıklamayı erişilebilir adla bağlar', async () => {
    render(<Harness />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aç' }));
    expect(dialog()).toHaveAccessibleName('Mail gönderilsin mi?');
    expect(dialog()).toHaveAccessibleDescription('Geri alınamaz.');
  });

  it('Esc (cancel olayı) pencereyi kapatır ve odağı açan düğmeye geri verir', async () => {
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);
    const opener = screen.getByRole('button', { name: 'Aç' });
    await userEvent.setup().click(opener);
    expect(dialog()).toHaveAttribute('open');

    fireEvent(dialog(), new Event('cancel', { cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toHaveAttribute('open');
    expect(opener).toHaveFocus();
  });

  it('gönderim sürerken Esc pencereyi kapatmaz', async () => {
    const onCancel = vi.fn();
    render(<Harness busy onCancel={onCancel} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aç' }));
    fireEvent(dialog(), new Event('cancel', { cancelable: true }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
