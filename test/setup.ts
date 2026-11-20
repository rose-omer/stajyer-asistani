import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom scrollTo uygulamaz; rota değişiminde çağrılır.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
});
