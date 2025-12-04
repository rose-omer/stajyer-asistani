import React from 'react';
import { Mail, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Stajyer Asistanı <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">v1.5 (Gemini 2.5 Flash)</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">AI Destekli Profesyonel İletişim Aracı</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="hidden md:inline">Gemini 2.5 Flash ile Güçlendirildi</span>
        </div>
      </div>
    </header>
  );
};