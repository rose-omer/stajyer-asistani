import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InputField } from './components/InputField';
import { ResultCard } from './components/ResultCard';
import { ApplicantProfile, TargetCompany, LogEntry, DiscoveredCompany, AppSettings } from './types';
import { analyzeCompany, generateEmail, findTechnoparkCompanies, analyzeCV } from './services/geminiService';
import { sendRealEmail, openMailClient } from './services/emailService';
import { initSupabase, fetchLogs, addLog, checkCompanyHistory } from './services/supabaseService';
import { 
  User, Building2, Send, Search, Sparkles, 
  Plus, Trash2, Mail, CheckCircle, Clock, 
  ArrowRight, History, Globe, Loader2, RefreshCw, Upload, Settings, AlertTriangle, Save, Cloud, Rocket, StopCircle, Link, MessageSquare, Database, Edit3, Paperclip, XCircle
} from 'lucide-react';

// Varsayılan Değerler
const INITIAL_PROFILE: ApplicantProfile = {
  fullName: '',
  university: '',
  department: '',
  grade: '',
  startDate: 'Şubat 2026 - Haziran 2026', // Kullanıcı isteği üzerine sabitlendi
  specialty: '',
  keySkill: '',
  cvNote: 'Özgeçmişim ektedir.',
  cvUrl: '',
  tone: 'formal',
  phone: '',
  email: '',
  linkedin: '',
  portfolio: 'https://omerksoft.com.tr/'
};

const INITIAL_SETTINGS: AppSettings = {
  googleScriptUrl: '',
  supabaseUrl: (import.meta as any).env.VITE_SUPABASE_URL || '',
  supabaseKey: (import.meta as any).env.VITE_SUPABASE_KEY || ''
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'discovery' | 'companies' | 'queue' | 'history' | 'settings'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // State Initialization
  const [profile, setProfile] = useState<ApplicantProfile>(() => {
    try {
      const saved = localStorage.getItem('stajyer_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch { return INITIAL_PROFILE; }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('stajyer_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...INITIAL_SETTINGS, 
          ...parsed,
          supabaseUrl: parsed.supabaseUrl || INITIAL_SETTINGS.supabaseUrl,
          supabaseKey: parsed.supabaseKey || INITIAL_SETTINGS.supabaseKey
        };
      }
      return INITIAL_SETTINGS;
    } catch { return INITIAL_SETTINGS; }
  });

  const [companies, setCompanies] = useState<TargetCompany[]>(() => {
    try {
      const saved = localStorage.getItem('stajyer_companies');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // UI States
  const [newCompanyName, setNewCompanyName] = useState('');
  const [discoveryCity, setDiscoveryCity] = useState('Ankara');
  const [discoveryTechnopark, setDiscoveryTechnopark] = useState('');
  const [discoveredCompanies, setDiscoveredCompanies] = useState<DiscoveredCompany[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [isAnalyzingCv, setIsAnalyzingCv] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Autopilot States
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [autoPilotStatus, setAutoPilotStatus] = useState<string>('');
  const [autoPilotProgress, setAutoPilotProgress] = useState(0);

  // Effects
  useEffect(() => {
    if (settings.supabaseUrl && settings.supabaseKey) {
      initSupabase(settings.supabaseUrl, settings.supabaseKey);
      refreshLogs();
    }
  }, [settings.supabaseUrl, settings.supabaseKey]);

  // CV data is now stored in profile state via localStorage, no separate restoration needed
  
  // Load logs on mount
  useEffect(() => {
    refreshLogs();
  }, []);

  useEffect(() => {
    setIsSaving(true);
    localStorage.setItem('stajyer_profile', JSON.stringify(profile));
    setTimeout(() => setIsSaving(false), 500);
  }, [profile]);

  useEffect(() => {
    setIsSaving(true);
    localStorage.setItem('stajyer_companies', JSON.stringify(companies));
    setTimeout(() => setIsSaving(false), 500);
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('stajyer_settings', JSON.stringify(settings));
  }, [settings]);

  const refreshLogs = async () => {
    // Always load from localStorage first
    const localLogs = JSON.parse(localStorage.getItem('stajyer_logs') || '[]');
    setLogs(localLogs);
    
    // Then try to load from Supabase
    if (settings.supabaseUrl && settings.supabaseKey) {
      try {
        const data = await fetchLogs();
        if (data.length > 0) {
          setLogs(data);
        }
      } catch (e) { 
        console.warn('Supabase yüklenemedi, localStorage kullanılıyor:', e);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64WithPrefix = reader.result as string;
        const base64 = base64WithPrefix.split(',')[1]; // Remove data:mime;base64, prefix
        
        setProfile(prev => ({ 
          ...prev, 
          cvFileName: file.name, 
          cvFile: file,
          cvFileBase64: base64,
          cvFileType: file.type
        }));
      };
    }
  };

  const handleCvAnalysis = async () => {
    if (!profile.cvFile) return alert("Dosya seçiniz.");
    setIsAnalyzingCv(true);
    try {
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.readAsDataURL(profile.cvFile!);
        r.onload = () => res((r.result as string).split(',')[1]);
      });
      const data = await analyzeCV(base64, profile.cvFile.type);
      setProfile(prev => ({ ...prev, ...data }));
      alert("CV Analiz Edildi!");
    } catch (e: any) { alert(e.message); }
    finally { setIsAnalyzingCv(false); }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return alert("Test e-posta adresi giriniz.");
    if (!profile.fullName || !profile.specialty) return alert("Profil bilgilerinizi doldurunuz.");
    if (!settings.googleScriptUrl) return alert("Ayarlar > Google Script URL girilmedi!");

    setIsSendingTest(true);
    try {
      // Sahte bir şirket oluştur
      const testCompany: TargetCompany = {
        id: 'test',
        name: 'Test Şirketi',
        status: 'generated',
        analysis: {
          industry: 'Teknoloji',
          focusTopic: 'Yazılım Geliştirme',
          contactPerson: 'İnsan Kaynakları',
          email: testEmail
        },
        emailDraft: await generateEmail(profile, {
          id: 'test',
          name: 'Test Şirketi',
          status: 'analyzed',
          analysis: {
            industry: 'Teknoloji',
            focusTopic: 'Yazılım Geliştirme',
            contactPerson: 'İnsan Kaynakları',
            email: testEmail
          }
        })
      };

      await sendRealEmail(settings, profile, testCompany);
      alert('Test e-postası gönderildi! Gelen kutunuzu kontrol edin.');
    } catch (e: any) {
      alert('Hata: ' + e.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDiscovery = async (append = false) => {
    setIsDiscovering(true);
    setDiscoveryError(null);
    if (!append) setDiscoveredCompanies([]);
    try {
      // Fetch exclude list from logs to prevent duplicates
      const logData = await fetchLogs(); 
      const sentNames = logData.map(l => l.companyName);
      const currentNames = companies.map(c => c.name);
      
      const results = await findTechnoparkCompanies(discoveryCity, discoveryTechnopark, [...sentNames, ...currentNames]);
      setDiscoveredCompanies(prev => append ? [...prev, ...results] : results);
      return results;
    } catch (e: any) {
      setDiscoveryError(e.message);
      return [];
    } finally { setIsDiscovering(false); }
  };

  const addDiscoveredCompany = async (name: string) => {
    // Check local duplicate
    if (companies.some(c => c.name.toLowerCase() === name.toLowerCase())) return null;
    
    // Check localStorage history
    const localLogs = JSON.parse(localStorage.getItem('stajyer_logs') || '[]');
    const localExists = localLogs.some((log: any) => 
      log.companyName.toLowerCase() === name.toLowerCase() && log.status === 'success'
    );
    
    // Check DB history
    const dbExists = await checkCompanyHistory(name);
    
    if (localExists || dbExists) {
      console.log(`⚠️ ${name} - Daha önce mail atılmış, atlanıyor`);
      return null;
    }

    const newCo: TargetCompany = { id: Date.now() + Math.random().toString(), name, status: 'idle' };
    setCompanies(prev => [...prev, newCo]);
    return newCo;
  };

  const handleAnalyze = async (id: string, name: string) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'analyzing' } : c));
    try {
      const analysis = await analyzeCompany(name);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'analyzed', analysis } : c));
      return analysis;
    } catch (e) {
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'error', errorMessage: 'Analiz Hatası' } : c));
      throw e;
    }
  };

  const handleGenerate = async (company: TargetCompany) => {
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'generating' } : c));
    try {
      const draft = await generateEmail(profile, company);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'generated', emailDraft: draft } : c));
      return draft;
    } catch (e) {
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'error', errorMessage: 'Draft Hatası' } : c));
      throw e;
    }
  };

  const handleSendReal = async (company: TargetCompany) => {
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'sending' } : c));
    try {
      await sendRealEmail(settings, profile, company);
      
      const logEntry = {
        id: Date.now().toString(),
        companyName: company.name,
        position: profile.specialty,
        emailSubject: company.emailDraft?.subject || '',
        sentDate: new Date().toLocaleString('tr-TR'),
        status: 'success' as const
      };
      
      // Save to localStorage (always works)
      const existingLogs = JSON.parse(localStorage.getItem('stajyer_logs') || '[]');
      existingLogs.unshift(logEntry);
      localStorage.setItem('stajyer_logs', JSON.stringify(existingLogs.slice(0, 100))); // Keep last 100
      
      // Also try Supabase
      try {
        await addLog({
          companyName: company.name,
          position: profile.specialty,
          emailSubject: company.emailDraft?.subject || '',
          status: 'success'
        });
      } catch (dbError) {
        console.warn('Supabase log hatası (localStorage kaydedildi):', dbError);
      }
      
      // Update logs state
      setLogs(prev => [logEntry, ...prev]);
      
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'sent', sentDate: new Date().toLocaleDateString() } : c));
      
    } catch (e: any) {
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'error', errorMessage: e.message } : c));
      
      const errorLog = {
        id: Date.now().toString(),
        companyName: company.name,
        position: profile.specialty,
        emailSubject: 'Hata: ' + e.message,
        sentDate: new Date().toLocaleString('tr-TR'),
        status: 'failed' as const
      };
      
      // Save error to localStorage
      const existingLogs = JSON.parse(localStorage.getItem('stajyer_logs') || '[]');
      existingLogs.unshift(errorLog);
      localStorage.setItem('stajyer_logs', JSON.stringify(existingLogs.slice(0, 100)));
      
      try {
        await addLog({ companyName: company.name, position: profile.specialty, emailSubject: 'Hata', status: 'failed' });
      } catch (dbError) {
        console.warn('Supabase log hatası:', dbError);
      }
      
      setLogs(prev => [errorLog, ...prev]);
      throw e;
    }
  };

  const startAutoPilot = async () => {
    // Validation checks
    if (!settings.googleScriptUrl) return alert("❌ Ayarlar > Google Script URL girilmedi!");
    if (!import.meta.env.VITE_GEMINI_API_KEY) return alert("❌ API Key (.env) Bulunamadı! 'VITE_GEMINI_API_KEY' tanımlı olmalı.");
    if (!profile.fullName || !profile.specialty) return alert("❌ Profil bilgilerinizi doldurun (Ad Soyad, Uzmanlık)!");
    if (!profile.cvFileBase64) return alert("❌ CV dosyanızı yükleyin!");
    if (!discoveryCity) return alert("❌ Keşfet sekmesinde şehir giriniz!");

    if (!confirm("🚀 Otopilot başlatılacak!\n\n✅ CV'niz ekli olarak\n✅ " + discoveryCity + " şehrinden 10 şirket bulacak\n✅ Şirketleri analiz edecek\n✅ Kişiselleştirilmiş mail atacak\n\nDevam mı?")) return;

    setIsAutoPilotRunning(true);
    setAutoPilotStatus("Başlatılıyor...");
    setAutoPilotProgress(0);
    
    try {
      // 1. Discover
      console.log("🚀 Otopilot: Şirket keşfi başlıyor...");
      setAutoPilotStatus("Şirketler aranıyor...");
      const found = await handleDiscovery(false);
      console.log("🔍 Bulunan şirket sayısı:", found.length);
      
      if (!found.length) throw new Error("Şirket bulunamadı");

      // 2. Process Loop
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < found.length; i++) {
        const comp = found[i];
        
        console.log(`\n📋 [${i+1}/${found.length}] İşleniyor: ${comp.name}`);
        setAutoPilotStatus(`[${i+1}/${found.length}] ${comp.name} işleniyor...`);
        setAutoPilotProgress(((i+1)/found.length)*100);

        try {
          // Add company
          const companyObj = await addDiscoveredCompany(comp.name);
          if (!companyObj) {
            console.log("⏭️ Şirket zaten mevcut, atlanıyor");
            continue;
          }

          await delay(300); // Azaltıldı: 1500 -> 300ms
          
          // Analyze
          console.log("🔎 Analiz ediliyor...");
          const analysis = await handleAnalyze(companyObj.id, comp.name);
          console.log("✅ Analiz tamamlandı. Email:", analysis.email || "Bulunamadı");
          
          // If email found, generate and send
          if (analysis.email) {
            await delay(300); // Azaltıldı: 1500 -> 300ms
            console.log("✍️ Mail oluşturuluyor...");
            const draft = await handleGenerate({ ...companyObj, analysis, status: 'analyzed' });
            console.log("📧 Mail konusu:", draft.subject);
            
            await delay(500); // Azaltıldı: 1500 -> 500ms (mail gönderimi öncesi biraz daha bekle)
            console.log("📤 Mail gönderiliyor...");
            await handleSendReal({ ...companyObj, analysis, emailDraft: draft, status: 'generated' });
            console.log("✅ Mail gönderildi!");
            successCount++;
          } else {
            console.warn("⚠️ İK maili bulunamadı");
            setCompanies(prev => prev.map(c => c.id === companyObj.id ? { ...c, status: 'error', errorMessage: 'İK Maili Bulunamadı' } : c));
            errorCount++;
          }
          await delay(1000); // Azaltıldı: 3000 -> 1000ms (cool down)
        } catch (compError: any) {
          console.error(`❌ ${comp.name} işlenirken hata:`, compError.message);
          errorCount++;
          await delay(500); // Azaltıldı: 2000 -> 500ms
        }
      }
      
      const finalMsg = `Otopilot Tamamlandı! ✅ ${successCount} başarılı, ❌ ${errorCount} hata`;
      console.log("\n🎉 " + finalMsg);
      setAutoPilotStatus(finalMsg);
      alert(finalMsg);
    } catch (e: any) {
      console.error("❌ Otopilot Hatası:", e);
      setAutoPilotStatus("Hata: " + e.message);
      alert("Otopilot Hatası: " + e.message);
    } finally {
      setTimeout(() => {
        setIsAutoPilotRunning(false);
        setAutoPilotProgress(0);
      }, 3000);
    }
  };

  const handleSaveSettings = () => {
     try {
        localStorage.setItem('stajyer_settings', JSON.stringify(settings));
        initSupabase(settings.supabaseUrl, settings.supabaseKey);
        refreshLogs();
        alert("Ayarlar kaydedildi ve bağlantı yenilendi.");
     } catch(e) {
        alert("Kaydetme hatası");
     }
  };

  const poolCompanies = companies.filter(c => c.status !== 'sent');
  const queueCompanies = companies.filter(c => c.status !== 'idle' && c.status !== 'analyzing' && c.status !== 'sent');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      <Header />
      
      {/* Saving Indicator */}
      <div className="fixed top-20 right-4 z-40 flex flex-col items-end gap-2">
         {isSaving && <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">Kaydediliyor...</div>}
         {settings.supabaseUrl && <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex items-center gap-1"><Cloud className="w-3 h-3"/> Online</div>}
      </div>

      {/* AutoPilot Overlay */}
      {isAutoPilotRunning && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-white backdrop-blur-sm">
          <Rocket className="w-20 h-20 text-indigo-400 animate-bounce mb-6" />
          <h2 className="text-3xl font-bold mb-2">Otopilot Devrede</h2>
          <p className="text-slate-300 mb-8 max-w-md text-center">Arkanıza yaslanın. Stajyer Asistanı sizin için çalışıyor.</p>
          
          <div className="w-full max-w-lg bg-slate-800 rounded-full h-6 mb-4 overflow-hidden border border-slate-700">
             <div className="bg-indigo-500 h-full transition-all duration-500 relative" style={{width: `${autoPilotProgress}%`}}>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
             </div>
          </div>
          
          <p className="font-mono text-indigo-300 text-lg mb-8">{autoPilotStatus}</p>
          
          <button 
            onClick={() => { setIsAutoPilotRunning(false); window.location.reload(); }} 
            className="flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/50 px-6 py-3 rounded hover:bg-red-600 hover:text-white transition-all"
          >
            <StopCircle className="w-5 h-5" /> ACİL DURDUR
          </button>
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex overflow-x-auto gap-2 mb-6 border-b border-slate-200 pb-1 scrollbar-hide">
          {[
            { id: 'profile', icon: User, label: 'Profil' },
            { id: 'discovery', icon: Globe, label: 'Keşfet & Otopilot' },
            { id: 'companies', icon: Building2, label: `Havuz (${poolCompanies.length})` },
            { id: 'queue', icon: Send, label: `Gönderim (${queueCompanies.length})` },
            { id: 'history', icon: History, label: 'Geçmiş' },
            { id: 'settings', icon: Settings, label: 'Ayarlar' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition whitespace-nowrap text-sm font-medium ${activeTab === tab.id ? 'bg-white text-indigo-600 border-x border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-indigo-600"/> Profil Bilgileri</h2>
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-center">
               <div className="flex-1">
                 <label className="font-bold text-indigo-900 block mb-1 text-sm">CV Dosyası (Max 20MB)</label>
                 <div className="flex gap-2 items-center">
                   <label className="cursor-pointer bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 flex items-center gap-2 transition-colors">
                      <Upload className="w-4 h-4"/>
                      {profile.cvFileName || "Dosya Seç..."}
                      <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="hidden"/>
                   </label>
                 </div>
               </div>
               <button onClick={handleCvAnalysis} disabled={isAnalyzingCv} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2">
                 {isAnalyzingCv ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                 {isAnalyzingCv ? 'Analiz Ediliyor...' : 'CV\'den Doldur'}
               </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
               <InputField label="Ad Soyad" value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} />
               <InputField label="Üniversite" value={profile.university} onChange={e => setProfile({...profile, university: e.target.value})} />
               <InputField label="Bölüm" value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} />
               <InputField label="Uzmanlık (Pozisyon)" value={profile.specialty} onChange={e => setProfile({...profile, specialty: e.target.value})} placeholder="Örn: Frontend Developer" />
               <div className="md:col-span-2">
                 <InputField label="Staj Tarihleri" value={profile.startDate} onChange={e => setProfile({...profile, startDate: e.target.value})} placeholder="Şubat 2026 - Haziran 2026" />
               </div>
               <div className="md:col-span-2">
                 <InputField label="Öne Çıkan Yetenek (Kanca Cümlesi)" value={profile.keySkill} onChange={e => setProfile({...profile, keySkill: e.target.value})} placeholder="Örn: React ile geliştirdiğim e-ticaret projesi..." helperText="Bu cümle mailin en dikkat çekici kısmına eklenecektir." />
               </div>
               
               {/* İletişim Bilgileri */}
               <InputField label="Telefon" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+90 555 123 4567" helperText="CV'den otomatik çıkarılır" />
               <InputField label="E-posta" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="ornek@email.com" helperText="CV'den otomatik çıkarılır" />
               <div className="md:col-span-2">
                 <InputField label="LinkedIn" value={profile.linkedin || ''} onChange={e => setProfile({...profile, linkedin: e.target.value})} placeholder="linkedin.com/in/kullanici-adi" helperText="CV'den otomatik çıkarılır" />
               </div>
               
               <div className="md:col-span-2">
                 <InputField label="Portfolio/Website" value={profile.portfolio || ''} onChange={e => setProfile({...profile, portfolio: e.target.value})} placeholder="https://omerksoft.com.tr/" helperText="Portfolyo siteniz mail imzasına eklenecek" />
               </div>
               
               <div className="md:col-span-2">
                 <InputField label="CV Linki (Drive/LinkedIn)" value={profile.cvUrl} onChange={e => setProfile({...profile, cvUrl: e.target.value})} placeholder="https://..." helperText="Eğer CV dosyanız çok büyükse bu link mailin sonuna eklenir." />
               </div>
            </div>

            {/* Test E-posta Gönderimi */}
            <div className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-lg">
              <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5"/> Test E-postası Gönder
              </h3>
              <p className="text-sm text-emerald-700 mb-4">Sistemi test etmek için kendi e-posta adresinize CV'li bir deneme e-postası gönderin.</p>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="email" 
                  value={testEmail} 
                  onChange={e => setTestEmail(e.target.value)} 
                  placeholder="test@email.com" 
                  className="flex-1 border border-emerald-300 p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button 
                  onClick={handleSendTestEmail} 
                  disabled={isSendingTest}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center gap-2 transition-colors"
                >
                  {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                  {isSendingTest ? 'Gönderiliyor...' : 'Test Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DISCOVERY TAB --- */}
        {activeTab === 'discovery' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-600"/> Şirket Bul</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
               <div className="flex-1">
                  <input className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Şehir (Örn: İstanbul)" value={discoveryCity} onChange={e => setDiscoveryCity(e.target.value)} />
               </div>
               <div className="flex-1">
                  <input className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Teknokent (Opsiyonel)" value={discoveryTechnopark} onChange={e => setDiscoveryTechnopark(e.target.value)} />
               </div>
               <button onClick={() => handleDiscovery(false)} disabled={isDiscovering} className="bg-slate-800 text-white px-8 py-3 rounded-lg hover:bg-slate-900 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors">
                  {isDiscovering ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} Bul
               </button>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-xl flex flex-col md:flex-row items-center justify-between mb-8 shadow-lg relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
               <div className="relative z-10 mb-4 md:mb-0">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-1"><Rocket className="w-6 h-6"/> Otopilot Modu</h3>
                  <p className="text-indigo-100 text-sm opacity-90">Arkanıza yaslanın. Sistem 10 şirketi bulup, analiz edip maillerini otomatik atar.</p>
               </div>
               <button onClick={startAutoPilot} disabled={isAutoPilotRunning} className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-50 disabled:opacity-50 transition-all flex items-center gap-2">
                  OTOPİLOTU BAŞLAT <ArrowRight className="w-4 h-4"/>
               </button>
            </div>

            {discoveryError && <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {discoveryError}</div>}

            <div className="grid gap-3">
               {discoveredCompanies.map((c, i) => (
                 <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors bg-white">
                    <div>
                       <div className="font-bold text-slate-800">{c.name}</div>
                       <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3"/> {c.location}</div>
                       <p className="text-xs text-slate-400 mt-1 line-clamp-1">{c.brief}</p>
                    </div>
                    <button onClick={() => addDiscoveredCompany(c.name)} className="text-indigo-600 border border-indigo-200 p-2 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all"><Plus className="w-5 h-5"/></button>
                 </div>
               ))}
               {discoveredCompanies.length === 0 && !isDiscovering && !discoveryError && (
                  <div className="text-center py-10 text-slate-400">Arama yapmak için yukarıdaki formu kullanın.</div>
               )}
            </div>
          </div>
        )}

        {/* --- COMPANIES TAB --- */}
        {activeTab === 'companies' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fadeIn">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600"/> Analiz Havuzu</h2>
                <div className="flex gap-2">
                   <input placeholder="Manuel Şirket Ekle" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} className="border p-2 rounded-lg text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                   <button onClick={() => {if(newCompanyName) {addDiscoveredCompany(newCompanyName); setNewCompanyName('')}}} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900"><Plus className="w-5 h-5"/></button>
                </div>
             </div>
             <div className="grid gap-4">
                {poolCompanies.map(c => (
                  <div key={c.id} className="border border-slate-200 rounded-xl p-5 relative hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800">{c.name}</h3>
                        <div className="flex gap-2">
                           <button onClick={() => handleAnalyze(c.id, c.name)} disabled={c.status === 'analyzing'} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md border border-indigo-100 hover:bg-indigo-100 font-medium transition-colors">
                              {c.status === 'analyzing' ? 'Analiz...' : 'Analiz Et'}
                           </button>
                           <button onClick={() => setCompanies(prev => prev.filter(x => x.id !== c.id))} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${c.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                     </div>
                     
                     {c.analysis && (
                       <div className="mt-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="grid grid-cols-2 gap-2 mb-3">
                             <div><span className="text-slate-400 text-xs block">Sektör</span>{c.analysis.industry}</div>
                             <div><span className="text-slate-400 text-xs block">Hedef Mail</span>{c.analysis.email || <span className="text-red-400">Bulunamadı</span>}</div>
                             <div className="col-span-2"><span className="text-slate-400 text-xs block">Odak</span>{c.analysis.focusTopic}</div>
                          </div>
                          <button onClick={() => handleGenerate(c)} disabled={c.status === 'generating'} className="w-full text-xs bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2">
                             <Edit3 className="w-3 h-3"/> {c.status === 'generating' ? 'Yazılıyor...' : 'Taslak Oluştur'}
                          </button>
                       </div>
                     )}
                     {c.errorMessage && <p className="text-xs text-red-500 mt-2 bg-red-50 p-1 rounded">{c.errorMessage}</p>}
                  </div>
                ))}
                {poolCompanies.length === 0 && <div className="text-center py-12 text-slate-400">Havuz boş. Keşfet sekmesinden şirket ekleyin.</div>}
             </div>
          </div>
        )}

        {/* --- QUEUE TAB --- */}
        {activeTab === 'queue' && (
           <div className="grid gap-6 animate-fadeIn">
              {queueCompanies.map(c => (
                 <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
                       <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-500"/> {c.name}</h3>
                       <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${c.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Konu Başlığı</label>
                             <input className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={c.emailDraft?.subject || ''} onChange={e => setCompanies(prev => prev.map(x => x.id === c.id ? {...x, emailDraft: {...x.emailDraft!, subject: e.target.value}} : x))} />
                          </div>
                          
                          <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mail İçeriği</label>
                             <textarea className="w-full border p-2.5 rounded-lg h-48 text-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none" value={c.emailDraft?.body || ''} onChange={e => setCompanies(prev => prev.map(x => x.id === c.id ? {...x, emailDraft: {...x.emailDraft!, body: e.target.value}} : x))} />
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
                          <div className="mb-2">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Alıcı (Hedef)</p>
                             <p className="text-sm font-medium text-slate-900 break-all">{c.analysis?.email || 'Belirtilmemiş'}</p>
                          </div>
                          <div className="mb-4">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Ekler</p>
                             <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                <Paperclip className="w-3 h-3"/> {profile.cvFileName || 'CV Eklenmemiş'}
                             </p>
                          </div>
                          
                          <button onClick={() => handleSendReal(c)} disabled={c.status === 'sending'} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                             {c.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} 
                             Google ile Gönder
                          </button>
                          
                          <div className="relative flex py-2 items-center">
                             <div className="flex-grow border-t border-slate-300"></div>
                             <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">VEYA</span>
                             <div className="flex-grow border-t border-slate-300"></div>
                          </div>
                          
                          <button onClick={() => openMailClient(c.analysis?.email || '', c.emailDraft?.subject || '', c.emailDraft?.body || '')} className="w-full bg-white border border-slate-300 py-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                             <MessageSquare className="w-4 h-4"/> Outlook/Mail Uygulamasında Aç
                          </button>
                       </div>
                    </div>
                    {c.errorMessage && <p className="text-red-600 text-xs mt-4 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2"><XCircle className="w-4 h-4"/> {c.errorMessage}</p>}
                 </div>
              ))}
              {queueCompanies.length === 0 && <div className="text-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200 border-dashed">Gönderilecek taslak yok. Havuzdan taslak oluşturun.</div>}
           </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-fadeIn max-w-2xl mx-auto">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="w-5 h-5"/> Ayarlar</h2>
             <InputField label="Google Script Web App URL" value={settings.googleScriptUrl} onChange={e => setSettings({...settings, googleScriptUrl: e.target.value})} placeholder="https://script.google.com/macros/s/.../exec" helperText="Google Apps Script > Dağıt > Web Uygulaması > Erişim: Herkes" />
             
             <div className="mt-6 space-y-3">
                <div className="p-4 bg-indigo-50 text-indigo-900 text-sm rounded-lg border border-indigo-100">
                   <strong>Önemli:</strong> Google Script'i dağıtırken <u>"Yürüten: Ben (Execute as Me)"</u> ve <u>"Erişim: Herkes (Anyone)"</u> seçtiğinizden emin olun. Yoksa mailler gitmez.
                </div>
                <div className="p-4 bg-green-50 text-green-800 text-sm rounded-lg border border-green-100 flex items-center gap-2">
                   <CheckCircle className="w-4 h-4"/>
                   API Anahtarları (Google GenAI & Supabase) <code>.env</code> dosyasından yükleniyor.
                </div>
             </div>

             <button onClick={handleSaveSettings} className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4"/> Bağlantıyı Test Et ve Kaydet
             </button>
             
             <button onClick={() => window.location.reload()} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4"/> Uygulamayı Yenile
             </button>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
           <div className="bg-white p-6 rounded-xl border shadow-sm animate-fadeIn">
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><History className="w-5 h-5"/> Geçmiş</h2>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                       <tr>
                          <th className="p-4">Tarih</th>
                          <th className="p-4">Şirket</th>
                          <th className="p-4">Pozisyon</th>
                          <th className="p-4">Durum</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {logs.map((l,i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4 text-slate-500">{l.sentDate}</td>
                             <td className="p-4 font-bold text-slate-900">{l.companyName}</td>
                             <td className="p-4 text-slate-600">{l.position}</td>
                             <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${l.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {l.status}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {logs.length === 0 && <div className="text-center py-10 text-slate-400">Henüz kayıt yok.</div>}
           </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default App;