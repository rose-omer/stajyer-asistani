import { describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { KEYS } from '../lib/storage';

async function go(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('App (demo modu)', () => {
  it('onay alınmadan uygulama açılmaz', async () => {
    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole('button', { name: 'Onayla ve devam et' });
    const checkbox = screen.getByLabelText(/Aydınlatma metnini okudum/);

    // Onaysız tıklama: neden söylenir, odak kutuya gider, uygulama açılmaz.
    await user.click(button);
    expect(screen.getByText('Devam etmek için onay kutusunu işaretle.')).toBeInTheDocument();
    expect(checkbox).toHaveFocus();
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('heading', { name: 'Profil' })).not.toBeInTheDocument();

    // Klavye ile onay: Boşluk kutuyu işaretler, Enter düğmeyi çalıştırır.
    await user.keyboard(' ');
    expect(screen.queryByText(/onay kutusunu işaretle/)).not.toBeInTheDocument();
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Profil' })).toBeInTheDocument();
  });

  it('rota URL’den okunur, gezinme aria-current ile işaretlenir ve odak başlığa taşınır', async () => {
    localStorage.setItem(KEYS.consent, new Date().toISOString());
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Profil' })).toBeInTheDocument();

    await go('#/kesfet');
    const heading = await screen.findByRole('heading', { level: 1, name: 'Şirket keşfi' });
    expect(heading).toHaveFocus();

    const navs = screen.getAllByRole('navigation', { name: 'Ana gezinme' });
    const current = within(navs[0]).getByRole('link', { current: 'page' });
    expect(current).toHaveAttribute('href', '#/kesfet');

    await go('#/havuz');
    expect(await screen.findByRole('heading', { level: 1, name: 'Havuz' })).toBeInTheDocument();
    expect(screen.getByText('Havuz boş')).toBeInTheDocument();
  });

  it('kuyruk boşken bir sonraki adımı gösterir', async () => {
    localStorage.setItem(KEYS.consent, new Date().toISOString());
    window.location.hash = '#/kuyruk';
    render(<App />);
    expect(await screen.findByText('Onay bekleyen taslak yok')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Havuzu aç' })).toHaveAttribute('href', '#/havuz');
  });

  it('havuza elle şirket ekler ve tekrarını reddeder', async () => {
    const user = userEvent.setup();
    localStorage.setItem(KEYS.consent, new Date().toISOString());
    window.location.hash = '#/havuz';
    render(<App />);
    const input = await screen.findByLabelText('Şirket adı');
    await user.type(input, 'Kuzgun Yazılım');
    await user.click(screen.getByRole('button', { name: 'Ekle' }));
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Kuzgun Yazılım' }),
    ).toBeInTheDocument();

    await user.type(input, 'kuzgun  yazılım');
    await user.click(screen.getByRole('button', { name: 'Ekle' }));
    expect(screen.getByText('Bu şirket zaten havuzda.')).toBeInTheDocument();
  });
});
