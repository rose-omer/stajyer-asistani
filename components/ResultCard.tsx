import React, { useState } from 'react';
import { Copy, Check, Share2, AlertCircle } from 'lucide-react';
import { GeneratedEmail } from '../types';

interface ResultCardProps {
  email: GeneratedEmail | null;
  loading: boolean;
  error: string | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({ email, loading, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!email) return;
    const fullText = `${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-pulse">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
           <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">E-postanız Hazırlanıyor...</h3>
        <p className="text-slate-500 mt-2 max-w-xs">Yapay zeka verdiğiniz bilgileri işliyor ve profesyonel bir taslak oluşturuyor.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full min-h-[200px] flex flex-col items-center justify-center bg-red-50 rounded-xl border border-red-100 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-lg font-medium text-red-800">Bir Hata Oluştu</h3>
        <p className="text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Henüz Bir Taslak Yok</h3>
        <p className="text-slate-500 mt-2 max-w-sm">Soldaki formu doldurun ve "E-posta Oluştur" butonuna tıklayarak ilk taslağınızı görün.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden flex flex-col h-full">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
        <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Oluşturulan Taslak
        </h3>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            copied 
              ? 'bg-green-100 text-green-700' 
              : 'bg-white text-slate-600 hover:text-indigo-600 hover:shadow-sm border border-slate-200'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto flex-grow bg-white">
        <div className="mb-4 pb-4 border-b border-slate-100">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konu</span>
           <p className="text-slate-900 font-medium text-lg mt-1">{email.subject.replace('Konu:', '').trim()}</p>
        </div>
        
        <div className="prose prose-slate prose-sm max-w-none">
          {email.body.split('\n').map((line, index) => (
            <p key={index} className="min-h-[1rem] whitespace-pre-wrap text-slate-700 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};