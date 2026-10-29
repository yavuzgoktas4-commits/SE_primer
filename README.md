# SE Primer — YZM301 Yazılım Mühendisliği Kriz Simülasyonu

## 🔗 Teslim Linkleri
- **GitHub Repo Linki:** https://github.com/yavuzgoktas4-commits/SE_primer.git
- **Google AI Studio Canlı Uygulama Linki:** `[AI Studio URL]`
- **Cypress Demo Video Linki (60 sn):** `[Video URL]`

---

## 1. Proje Özeti ve Mimarisi
**SE Primer**, YZM301 Yazılım Mühendisliği dersi kapsamında geliştirilmiş, mobil ve masaüstü tarayıcılarda doğrudan çalışan interaktif bir **üretim krizi (production incident) simülasyon oyunudur**.

Saat **08:00'de hastane randevu sisteminin çöktüğü ve 300 hastanın beklediği** yüksek stresli bir senaryoda öğrenciler; kendi deneyim seviyelerini (*Yeni Başladım / Deneyimliyim*), rollerini (*Backend / Frontend / Fullstack*) ve kriz hedeflerini (*Hızlı Çözüm / Sıfır veri kaybı*) seçerek **Mimari**, **Test** ve **KVKK** aşamalarında kritik kararlar alırlar. Her kararın ardından **"Ne oldu?"** ve **"Neden oldu?"** teknik analizleri gösterilir. Arayüzde yer alan **Sokratik AI Tutor**, öğrenci doğrudan cevabı istese bile doğru şıkkı sızdırmadan yönlendirici sorularla mühendislik muhakemesini destekler.

### Mimari Bileşenler ve Dosya Yapısı
```text
SE_Primer/
├── spec.md                         # Problem tanımı, kapsam dışı maddeler, 5 Gherkin kriteri ve Mermaid durum akış diyagramı
├── DESIGN.md                       # Stitch ekran entegrasyonu, obsidian_terminal tasarım sistemi ve thumb-zone ergonomisi
├── EVAL.md                         # Sokratik AI Tutor 20 red-team testi (%85 başarı, %15 sızıntı) ve hata analiz raporu
├── README.md                       # Teslim linkleri, kurulum yönergeleri ve Ürün Kararları
├── index.html                      # Mobil uyumlu (responsive) interaktif kriz simülasyonu arayüzü
├── style.css                       # obsidian_terminal koyu arduvaz temalı modern ve duyarlı stiller
├── app.js                          # Oyun durum makinesi, 60 sn sayaç, teknik açıklamalar ve Sokratik AI Tutor motoru
├── package.json                    # Cypress bağımlılıkları ve test:e2e video kayıt betiği
├── cypress.config.js               # Cypress E2E yapılandırma dosyası
├── assets/
│   └── screens/                    # Stitch ekran görselleri (01_onboarding.png, 02_crisis_decision.png, 03_outcome_report.png)
├── scripts/
│   └── sync_stitch_assets.js       # Stitch klasörlerinden ekran görsellerini senkronize eden yardımcı betik
└── cypress/
    └── e2e/
        └── game_flow.cy.js         # Son A (A->A->A) ve Son B (B->B->B) yollarını doğrulayan E2E testler
```

---

## 2. Kurulum ve Çalıştırma Yönergeleri

### 2.1. Uygulamayı Tarayıcıda Çalıştırma
Uygulama sıfır derleme (*zero-build*) mimarisiyle geliştirilmiştir. Doğrudan `index.html` dosyasını tarayıcıda açabilir veya yerel bir sunucu başlatabilirsiniz:
```bash
npx serve .
```

### 2.2. Cypress E2E Testlerini ve Video Kaydını Çalıştırma
Bağımlılıkları yükleyip uçtan uca testleri headless modda koşturmak ve `cypress/videos/game_flow.cy.js.mp4` altında otomatik test videosu üretmek için:
```bash
npm install
npm run test:e2e
```
*(Tüm E2E test senaryoları 60 saniyenin çok altında, yaklaşık 5–8 saniyede tamamlanmaktadır.)*

---

## 3. Ürün Kararları (Kapsam Dışı Bırakılan 3 Özellik ve Gerekçeleri)

1. **Auth / Giriş Sistemi (Kimlik Doğrulama):** Öğrencilerin kriz simülasyonuna kayıt veya şifre engeline takılmadan saniyeler içinde başlayabilmesi ve odak noktasının tamamen yazılım mühendisliği kararları kalması için kimlik doğrulama sistemi kapsam dışı bırakılmıştır.
2. **İkinci Oyun Senaryosu (2. Bölüm):** İlk bölümdeki mimari geri dönüş (rollback), duman testi (smoke test) ve KVKK veri maskeleme kazanımlarının derinlemesine deneyimlenmesi ve MVP sürecinde uçtan uca test edilmiş eksiksiz bir öğrenme döngüsü sunulması amacıyla ikinci senaryo kapsam dışı bırakılmıştır.
3. **Native Mobil Paketleme (iOS / Android Mağaza Uygulaması):** Herhangi bir uygulama mağazası indirme veya kurulum bariyeri olmadan tüm akıllı telefon ve bilgisayar tarayıcılarından anında erişim sağlamak adına native mobil paketleme yerine mobil öncelikli (`thumb-zone` uyumlu) responsive web mimarisi tercih edilmiştir.
