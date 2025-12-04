# 🚀 Stajyer Asistanı (Intern Assistant)

Bu proje, staj arama sürecini otomatize eden, yapay zeka destekli bir web uygulamasıdır. Google Gemini AI kullanarak şirketleri analiz eder, kişiselleştirilmiş staj başvurusu mailleri oluşturur ve Google Apps Script altyapısı ile CV'nizi ekleyerek otomatik gönderim yapar.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20Vite%20%7C%20TypeScript%20%7C%20Tailwind-blueviolet)

## ✨ Özellikler

*   **🤖 Otopilot Modu:** Seçilen şehirdeki teknoloji şirketlerini otomatik bulur, analiz eder ve başvuru yapar.
*   **🧠 Yapay Zeka Analizi:** Google Gemini AI ile şirketin sektörünü, odak alanlarını ve kültürünü analiz eder.
*   **✍️ Kişiselleştirilmiş Mailler:** Her şirket için özel, samimi ve profesyonel başvuru metinleri yazar.
*   **📎 Otomatik CV Ekleme:** PDF/Word formatındaki CV'nizi maillere otomatik olarak ekler.
*   **📧 Google Altyapısı:** Mailleri kendi Gmail hesabınız üzerinden (Google Apps Script ile) güvenli bir şekilde gönderir.
*   **💾 Akıllı Kayıt Sistemi:** Gönderilen mailleri ve şirketleri tarayıcı hafızasında (localStorage) tutar, mükerrer gönderimi engeller.
*   **📱 İletişim Bilgileri:** CV'nizden telefon, LinkedIn ve Portfolio bilgilerinizi otomatik çeker ve imza olarak ekler.

## 🛠️ Kullanılan Teknolojiler

*   **Frontend:** React, Vite, TypeScript
*   **Styling:** Tailwind CSS, Lucide React (İkonlar)
*   **AI:** Google Gemini 1.5 Flash API
*   **Backend (Serverless):** Google Apps Script (Mail gönderimi için)
*   **Database:** LocalStorage (Tarayıcı tabanlı kalıcı veri) & Supabase (Opsiyonel)

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/kullaniciadiniz/stajyer-asistani.git
cd stajyer-asistani
```

## 2. Bağımlılıkları Yükleyin
```
npm install
```
##  3. Çevre Değişkenlerini Ayarlayın (.env)
Ana dizinde .env.local adında bir dosya oluşturun ve Gemini API anahtarınızı ekleyin:


VITE_GEMINI_API_KEY=BURAYA_GEMINI_API_KEY_GELECEK# Opsiyonel: Supabase kullanacaksanızVITE_SUPABASE_URL=...VITE_SUPABASE_KEY=...
Not: Gemini API anahtarını Google AI Studio üzerinden ücretsiz alabilirsiniz.

## 4. Google Apps Script Kurulumu (Mail Gönderimi İçin)
Bu adım, maillerin sizin Gmail hesabınızdan gitmesi için gereklidir.

script.google.com adresine gidin ve "Yeni Proje" oluşturun.
Proje içindeki google-apps-script.js dosyasındaki kodları kopyalayıp oraya yapıştırın.
Dağıt (Deploy) > Yeni Dağıtım (New Deployment) seçeneğine tıklayın.
Tür olarak Web Uygulaması (Web App) seçin.
Erişim yetkisini "Herkes" (Anyone) olarak ayarlayın (Bu, React uygulamasının script'e erişmesini sağlar).
Verilen Web App URL'sini kopyalayın.
Uygulamayı çalıştırdıktan sonra Ayarlar sekmesine bu URL'yi yapıştırın.
5. Uygulamayı Başlatın
```
npm run dev
Tarayıcınızda http://localhost:5173 adresine gidin.
```
## 📖 Kullanım Kılavuzu
Profil: Ad, soyad, okul bilgilerinizi girin ve CV'nizi yükleyin.
Ayarlar: Google Apps Script URL'nizi kaydedin.
Keşfet & Otopilot:
Şehir seçin (örn: İstanbul, Ankara).
"Otopilotu Başlat" butonuna basın.
Arkanıza yaslanın! Sistem şirketleri bulacak ve başvuruları yapacaktır.
Geçmiş: Gönderilen başvuruları buradan takip edebilirsiniz.
## ⚠️ Önemli Notlar
Rate Limits: Google Gemini ve Google Apps Script'in günlük kullanım limitleri vardır. Çok hızlı ve aşırı gönderim yapmamaya özen gösterin.
Güvenlik: API anahtarlarınızı asla GitHub'a push etmeyin. .env dosyası .gitignore listesinde olmalıdır.
## 🤝 Katkıda Bulunma
Pull request'ler kabul edilir. Büyük değişiklikler için lütfen önce neyi değiştirmek istediğinizi tartışmak amacıyla bir konu (issue) açın.

## 📄 Lisans
MIT
/mit/)
