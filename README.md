## 🚀 Kurulum ve Çalıştırma

* Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### 1. Projeyi Klonlayın
```bash
@@ -39,40 +39,40 @@ cd stajyer-asistani
npm install
```
##  3. Çevre Değişkenlerini Ayarlayın (.env)
* Ana dizinde .env.local adında bir dosya oluşturun ve Gemini API anahtarınızı ekleyin:


* VITE_GEMINI_API_KEY=BURAYA_GEMINI_API_KEY_GELECEK# Opsiyonel: Supabase kullanacaksanızVITE_SUPABASE_URL=...VITE_SUPABASE_KEY=...
* Not: Gemini API anahtarını Google AI Studio üzerinden ücretsiz alabilirsiniz.

## 4. Google Apps Script Kurulumu (Mail Gönderimi İçin)
* Bu adım, maillerin sizin Gmail hesabınızdan gitmesi için gereklidir.

* script.google.com adresine gidin ve "Yeni Proje" oluşturun.
* Proje içindeki google-apps-script.js dosyasındaki kodları kopyalayıp oraya yapıştırın.
* Dağıt (Deploy) > Yeni Dağıtım (New Deployment) seçeneğine tıklayın.
* Tür olarak Web Uygulaması (Web App) seçin.
* Erişim yetkisini "Herkes" (Anyone) olarak ayarlayın (Bu, React uygulamasının script'e erişmesini sağlar).
* Verilen Web App URL'sini kopyalayın.
* Uygulamayı çalıştırdıktan sonra Ayarlar sekmesine bu URL'yi yapıştırın.
5. Uygulamayı Başlatın
```
npm run dev
Tarayıcınızda http://localhost:5173 adresine gidin.
```
## 📖 Kullanım Kılavuzu
* Profil: Ad, soyad, okul bilgilerinizi girin ve CV'nizi yükleyin.
* Ayarlar: Google Apps Script URL'nizi kaydedin.
* Keşfet & Otopilot:
* Şehir seçin (örn: İstanbul, Ankara).
* "Otopilotu Başlat" butonuna basın.
* Arkanıza yaslanın! Sistem şirketleri bulacak ve başvuruları yapacaktır.
* Geçmiş: Gönderilen başvuruları buradan takip edebilirsiniz.
## ⚠️ Önemli Notlar
* Rate Limits: Google Gemini ve Google Apps Script'in günlük kullanım limitleri vardır. Çok hızlı ve aşırı gönderim yapmamaya özen gösterin.
* Güvenlik: API anahtarlarınızı asla GitHub'a push etmeyin. .env dosyası .gitignore listesinde olmalıdır.
## 🤝 Katkıda Bulunma
* Pull request'ler kabul edilir. Büyük değişiklikler için lütfen önce neyi değiştirmek istediğinizi tartışmak amacıyla bir konu (issue) açın.

## 📄 Lisans
MIT
