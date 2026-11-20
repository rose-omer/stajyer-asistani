import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InputField, TextAreaField } from './InputField';

describe('InputField', () => {
  it('etiket alana bağlıdır (useId)', () => {
    render(<InputField label="Ad soyad" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Ad soyad')).toBeInstanceOf(HTMLInputElement);
  });

  it('iki alan farklı kimlik alır', () => {
    render(
      <>
        <InputField label="Telefon" value="" onChange={() => {}} />
        <InputField label="E-posta" value="" onChange={() => {}} />
      </>,
    );
    expect(screen.getByLabelText('Telefon').id).not.toBe(screen.getByLabelText('E-posta').id);
  });

  it('hata metni aria-describedby ile bağlı ve aria-invalid işaretli', () => {
    render(
      <InputField label="E-posta" value="x" onChange={() => {}} error="Geçerli bir adres yaz." />,
    );
    const input = screen.getByLabelText('E-posta');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Geçerli bir adres yaz.');
  });

  it('ipucu metni açıklama olarak okunur', () => {
    render(<TextAreaField label="Beceri" value="" onChange={() => {}} hint="Tek cümle yeter." />);
    expect(screen.getByLabelText('Beceri')).toHaveAccessibleDescription('Tek cümle yeter.');
  });
});
