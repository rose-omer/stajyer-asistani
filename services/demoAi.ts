import { AppError } from '../lib/errors';
import type { AiRequest } from '../supabase/functions/_shared/schemas';

/** Demo modu: ağ yok, anahtar yok. Gerçekçi gecikmeli sahte yanıtlar. */

const COMPANIES = [
  {
    name: 'Kuzgun Yazılım',
    location: 'ODTÜ Teknokent, Ankara',
    brief: 'Kurumlara saha ekibi yönetim yazılımı geliştiriyor.',
  },
  {
    name: 'Ardıç Veri Teknolojileri',
    location: 'Bilkent Cyberpark, Ankara',
    brief: 'Perakende için talep tahmini ve stok planlama çözümleri.',
  },
  {
    name: 'Selvi Robotik',
    location: 'Hacettepe Teknokent, Ankara',
    brief: 'Depo otomasyonu için otonom taşıma robotları üretiyor.',
  },
  {
    name: 'Mavi Kule Bilişim',
    location: 'ODTÜ Teknokent, Ankara',
    brief: 'Belediyelere açık veri ve e-hizmet altyapısı sağlıyor.',
  },
  {
    name: 'Lodos Siber Güvenlik',
    location: 'Gazi Teknopark, Ankara',
    brief: 'KOBİ’ler için yönetilen güvenlik izleme hizmeti.',
  },
  {
    name: 'Çınar Sağlık Yazılımı',
    location: 'Bilkent Cyberpark, Ankara',
    brief: 'Klinikler için randevu ve hasta takip platformu.',
  },
];

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AppError('İptal edildi.', 'ABORTED'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new AppError('İptal edildi.', 'ABORTED'));
      },
      { once: true },
    );
  });
}

function slug(name: string): string {
  return name
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '');
}

export async function demoAi(req: AiRequest, signal?: AbortSignal): Promise<unknown> {
  switch (req.action) {
    case 'analyze-cv':
      await wait(900, signal);
      return {
        fullName: 'Deniz Aksoy',
        university: 'Orta Doğu Teknik Üniversitesi',
        department: 'Bilgisayar Mühendisliği',
        grade: '3. sınıf',
        specialty: 'Frontend Geliştirici',
        keySkill: 'React ile 2.000 kullanıcılı bir kulüp etkinlik uygulaması geliştirdim.',
        startDate: 'Şubat 2026 – Haziran 2026',
        phone: '+90 555 000 00 00',
        email: 'deniz.aksoy@example.com',
        linkedin: 'linkedin.com/in/denizaksoy',
      };
    case 'discover': {
      await wait(1200, signal);
      const excluded = new Set(req.exclude.map((n) => n.toLocaleLowerCase('tr-TR')));
      return {
        companies: COMPANIES.filter((c) => !excluded.has(c.name.toLocaleLowerCase('tr-TR'))).map(
          (c) => ({ ...c, location: c.location.replace('Ankara', req.city) }),
        ),
        sources: ['https://odtuteknokent.com.tr/firmalar', 'https://cyberpark.com.tr/firmalar'],
      };
    }
    case 'analyze-company': {
      await wait(800, signal);
      const verified = slug(req.name).length % 2 === 0;
      const address = `kariyer@${slug(req.name)}.com.tr`;
      return {
        industry: 'Yazılım',
        focusTopic: `${req.name} ürün ekibinin web arayüzü ve veri görselleştirme çalışmaları`,
        contactPerson: 'İnsan Kaynakları Ekibi',
        email: verified ? address : null,
        emailCandidate: verified ? null : address,
        emailVerified: verified,
        sources: [`https://www.${slug(req.name)}.com.tr/kariyer`],
      };
    }
    case 'draft-email': {
      await wait(900, signal);
      const p = req.profile;
      const contact = [
        p.phone && `Telefon: ${p.phone}`,
        p.email && `E-posta: ${p.email}`,
        p.linkedin && `LinkedIn: ${p.linkedin}`,
      ]
        .filter(Boolean)
        .join('\n');
      const school = [p.university, p.department].filter(Boolean).join(' ');
      const intro = school
        ? `${school} öğrencisiyim.`
        : `${p.specialty} alanında staj arayan bir öğrenciyim.`;
      const when = p.startDate ? `${p.startDate} tarihleri arasında ` : '';
      return {
        subject: `${p.specialty} staj başvurusu – ${p.fullName}`,
        body: [
          `Sayın ${req.company.contactPerson || 'Yetkili'},`,
          '',
          `${intro} ${when}İşletmede Mesleki Eğitim kapsamında ${req.company.name} bünyesinde staj yapmak istiyorum. Sigortam okulum tarafından karşılanmaktadır.`,
          '',
          `${req.company.focusTopic ? `${req.company.focusTopic} alanındaki çalışmalarınız ilgimi çekiyor.` : ''} ${p.keySkill}`.trim(),
          '',
          `${p.hasAttachment ? 'Özgeçmişim ektedir. ' : ''}Uygun bir zamanda kısa bir görüşme yapabilirsek sevinirim.`,
          '',
          'Saygılarımla,',
          p.fullName,
          contact,
        ]
          .filter((l) => l !== undefined)
          .join('\n')
          .trim(),
      };
    }
  }
}
