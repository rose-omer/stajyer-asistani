import { AppSettings, ApplicantProfile, TargetCompany } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const openMailClient = (to: string, subject: string, body: string) => {
  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
};

export const sendRealEmail = async (
  settings: AppSettings,
  profile: ApplicantProfile,
  company: TargetCompany
): Promise<void> => {
  if (!settings.googleScriptUrl) {
    throw new Error("Google Script URL eksik! Ayarlardan giriniz.");
  }
  
  // URL kontrolü
  if (!settings.googleScriptUrl.includes('script.google.com')) {
     throw new Error("Geçersiz Script URL. 'script.google.com' içermelidir.");
  }

  const payload: any = {
    to: company.analysis?.email,
    subject: company.emailDraft?.subject,
    body: company.emailDraft?.body,
    fromName: profile.fullName
  };

  // Dosya ekleme
  if (profile.cvFileBase64 && profile.cvFileName) {
    try {
      console.log("CV Dosyası bulundu:", profile.cvFileName, "Base64 Length:", profile.cvFileBase64.length);
      
      // Base64 boyut kontrolü (yaklaşık 20MB = 27MB base64)
      if (profile.cvFileBase64.length > 27 * 1024 * 1024) {
         console.warn("Dosya çok büyük, eklenmedi.");
         payload.body += `\n\n(Not: CV dosyam büyük olduğu için eklenemedi, lütfen talep ediniz.)`;
      } else {
        payload.attachment = {
          name: profile.cvFileName,
          mimeType: profile.cvFileType || "application/pdf",
          data: profile.cvFileBase64
        };
        console.log("CV eklendi - İsim:", payload.attachment.name, "Type:", payload.attachment.mimeType);
      }
    } catch (e) {
      console.error("CV dosyası işlenemedi:", e);
    }
  } else {
    console.warn("CV dosyası bulunamadı! profile.cvFileBase64 veya cvFileName yok.");
  }

  // Google Apps Script'e POST isteği
  // mode: 'no-cors' kullanıyoruz çünkü Google Script varsayılan olarak CORS header göndermez.
  // Bu durumda response 'opaque' olur (içini okuyamayız) ama status 0 döner.
  // Eğer fetch hata vermezse, network isteği ulaşmış demektir.
  
  try {
    const response = await fetch(settings.googleScriptUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      // redirect: 'follow' önemlidir çünkü Google Script 302 redirect yapar.
      redirect: 'follow', 
    });

    // Not: no-cors modunda veya text/plain gönderiminde response.ok her zaman false veya erişilemez olabilir.
    // Ancak fetch catch bloğuna düşmediyse sunucuya ulaşmıştır.
    
    // Google Script tarafında "Execute as Me" ve "Who has access: Anyone" seçili değilse
    // Fetch başarılı gibi görünür ama Script çalışmaz (401/403 hatasını gizler).
    
    console.log("Mail isteği gönderildi.");
    
  } catch (error: any) {
    console.error("Mail Gönderim Hatası:", error);
    throw new Error("Sunucu ile iletişim kurulamadı. İnternet bağlantınızı veya Script URL'sini kontrol edin.");
  }
};