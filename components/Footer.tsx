import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Stajyer Asistanı. Google Gemini API kullanılarak oluşturulmuştur.
        </p>
      </div>
    </footer>
  );
};