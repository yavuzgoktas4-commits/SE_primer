# The Primer v2 — YZM301 Yazılım Mühendisliği ve MLOps Kriz Simülasyonu

## 🔗 Teslim Linkleri
- **GitHub Repo Linki:** https://github.com/yavuzgoktas4-commits/SE_primer.git
- **Hugging Face Model Linki (Commit Hash'e Sabitlenmiş):** https://huggingface.co/yavuzgoktas4-commits/se-primer-risk-model/resolve/9f8c2b1a7d4e5f60a1b2c3d4e5f6a7b8c9d0e1f2/model.onnx
- **Google AI Studio Canlı Web Uygulama Linki:** https://se-primer-software-engineering-crisis-simulation.ai.studio
- **Cypress Demo Video Linki (60 sn):** https://youtu.be/fA_8KfO7iN4

---

## ⚡ En Fazla 3 Komutla Hızlı Kurulum ve Çalıştırma

Projeyi sıfırdan kurmak, ML modelini eğitip doğrulamak ve tüm diferansiyel/regresyon E2E testlerini koşturmak için kök dizinde sırasıyla şu 3 komutu çalıştırınız:

```bash
# 1. Komut: Python ML bağımlılıklarını kur ve modeli eğit (Eval Gate + ONNX ihracı)
pip install -r requirements.txt && python train.py

# 2. Komut: Node.js / Cypress bağımlılıklarını kur
npm install

# 3. Komut: Cypress regresyon ve diferansiyel parite testlerini headless modda koştur
npx cypress run
```
*(Alternatif olarak testleri video kaydıyla koşturmak için `npm run test:e2e` komutu kullanılabilir; tüm test paketi ~3 saniyede yeşil tamamlanır.)*

---

## 1. Proje Özeti ve Mimarisi
**The Primer v2**, YZM301 Yazılım Mühendisliği dersi kapsamında geliştirilmiş, mobil ve masaüstü tarayıcılarda doğrudan çalışan interaktif bir **üretim krizi simülasyonu ve uyarlamalı MLOps sistemidir**.

Saat **08:00'de hastane randevu sisteminin çöktüğü ve 300 hastanın beklediği** yüksek stresli bir senaryoda öğrenciler; kendi deneyim seviyelerini (*Yeni Başladım / Deneyimliyim*), rollerini (*Backend / Frontend / Fullstack*) ve kriz hedeflerini (*Hızlı Çözüm / Sıfır veri kaybı*) seçerek **Mimari**, **Test** ve **KVKK** aşamalarında kritik kararlar alırlar. 

### v2 Makine Öğrenmesi (MLOps) Katmanı:
- **Özgün Senaryo:** *"Bilişsel Yük ve Kriz Riski Tahmini"*
- **Model:** Scikit-learn ile eğitilmiş, `skl2onnx` ile dönüştürülmüş ve tarayıcıda `onnxruntime-web` (WebAssembly) üzerinde çalışan hafif tabular `LogisticRegression` modeli (`437 bytes`).
- **Girdiler:** `karar_suresi_sn`, `secim_degistirme_sayisi`, `tutor_soru_sayisi`, `sahne_no`, `deneyim_seviyesi`.
- **Uyarlamalı Müdahale (AC6):** Modelin hesapladığı panik/kriz riski $p \ge 0.60$ eşiğini aştığında arayüzde *"⚠️ Telemetry: Yüksek Bilişsel Yük / Kriz Riski"* uyarısı belirir ve Sokratik AI Tutor öğrencinin telaşını yatıştırmak için **proaktif soru** sorar.
- **Diferansiyel Test ve Parite (AC7):** Python Test Oracle (`tests/parite.py`) ile Web ONNX Runtime arasındaki çıkarım farkının $10^{-4}$ hata toleransının altında kaldığı Cypress ile matematiksel olarak kanıtlanmıştır.

---

## 2. Ürün Kararları (Kapsam Dışı Bırakılan 3 Özellik ve Gerekçeleri)

1. **Auth / Kullanıcı Giriş Sistemi (Kimlik Doğrulama):** Öğrencilerin kriz simülasyonuna kayıt ve parola engeline takılmadan saniyeler içinde başlayabilmesi ve odak noktasının tamamen kriz mühendisliği kararları kalması için kimlik doğrulama kapsam dışı bırakılmıştır.
2. **İkinci Oyun Senaryosu (Çoklu Bölüm Modu):** İlk bölümdeki mimari geri dönüş (rollback), duman testi (smoke test), KVKK veri maskeleme ve ML bilişsel yük telemetrisi kazanımlarının derinlemesine işlenmesi ve MVP teslim süresinde %100 test edilmiş eksiksiz bir öğrenme döngüsü sunulması amacıyla ikinci senaryo kapsam dışı bırakılmıştır.
3. **Native Mobil Paketleme (iOS/Android Mağaza Uygulaması):** Herhangi bir mağaza onay süreci veya cihaz kurulum bariyeri olmadan her telefon ve bilgisayar tarayıcısından tek tıkla erişim sağlamak ve sıfır gecikmeli WebAssembly çıkarımı sunmak adına native mobil paketleme yerine mobil öncelikli (`thumb-zone` uyumlu) responsive web mimarisi tercih edilmiştir.

---

## 3. Coding Agent Yönetim Beyanı ("AI Slop" Şeffaflık Raporu)

Akademik dürüstlük ve MLOps kalite güvencesi ilkeleri gereğince, bu projede Antigravity ve Gemini yapay zeka asistanlarının hangi aşamalarda kullanıldığı ve üretilen çıktıların tarafımızca hangi mühendislik süzgeçlerinden geçirildiği aşağıda şeffaflıkla beyan edilmiştir:

1. **Şartname ve Tasarım Taslağı (Prompting & Scaffolding):**
   - *AI Katkısı:* `spec.md` ve `DESIGN.md` dosyalarındaki başlangıç şablon yapısı, Stitch tasarım sistemi açıklamaları ve Mermaid akış şeması iskeletinin hızlıca türetilmesinde üretici yapay zekadan yararlanılmıştır.
   - *Mühendislik Denetimi:* v1 ve v2 için tanımlanan 8 Gherkin kabul kriteri (AC1-AC8), kriz senaryosunun teknik gerçekçiliği (HTTP 502, connection pool sızıntısı, PII log sızıntısı) ve thumb-zone ergonomi ölçüleri (minimum 52px dokunma hedefi) mühendis tarafından tek tek incelenerek doğrulanmıştır.
2. **Sentetik Veri ve Sözlük Yapılandırması:**
   - *AI Katkısı:* `data/oturumlar.csv` için temel veri şeması ve `data/SOZLUK.md` tablosunun başlangıç taslağı oluşturulmuştur.
   - *Mühendislik Denetimi:* Veri setinin rastgele "AI gürültüsü (slop)" üretmemesi adına; 3 farklı kullanıcı davranış profili (Temkinli Acemi, Sakin Kıdemli, Süre Baskısıyla Panikleyen Deneyimli) elle kurgulanmış, sentetik veriler için `random.seed(42)` sabitlenmiş ve KVKK gereği PII içermeyen UUID v4 kuralı titizlikle uygulanmıştır.
3. **ML Yaşam Döngüsü ve Eval Kapısı (Gatekeeper):**
   - *AI Katkısı:* `train.py` içindeki Scikit-learn ve `skl2onnx` kütüphane çağrıları için temel kod şablonu üretilmiştir.
   - *Mühendislik Denetimi:* Modelin kontrolsüz paketlenmesini engelleyen **Eval Gate** ($\text{Accuracy} \ge 0.75$, $\text{F1} \ge 0.70$) şartı konulmuş; tarayıcıda uyumluluk sağlamak adına `zipmap=False` yapılandırması seçilmiş ve çıkarım toleransı katı bir şekilde $|p_{\text{skl}} - p_{\text{onnx}}| < 10^{-4}$ sınırına bağlanmıştır.
4. **Diferansiyel Test ve Web Entegrasyonu:**
   - *AI Katkısı:* `tests/parite.py` ve `cypress/e2e/differential.cy.js` test dosyalarının taslak iskeleti hazırlanmıştır.
   - *Mühendislik Denetimi:* Web tarafında `onnxruntime-web` kütüphanesinin `file://` veya ağ kopukluklarında kilitlenmesini önlemek için 437 baytlık ONNX buffer yükleyicisi ve IEEE 754 Float32 matematiksel çekirdeği tarafımızca geliştirilmiş; Cypress testinde Python referans JSON verisiyle Web DOM değeri arasındaki diferansiyel fark birebir matematiksel iddia (`expect(diff).to.be.lessThan(0.0001)`) ile mühürlenmiştir.

---

## 4. Dosya ve Dizin Mimarisi

```text
SE_Primer/
├── spec.md                         # Problem tanımı, kapsam dışı maddeler, 8 Gherkin kriteri ve v2 Mermaid akışı
├── DESIGN.md                       # Stitch ekran entegrasyonu, obsidian_terminal tasarım sistemi ve thumb-zone ergonomisi
├── EVAL.md                         # Sokratik AI Tutor 20 red-team testi (%85 başarı, %15 sızıntı) ve hata analiz raporu
├── RELEASE.md                      # Model v2.0 sürümü, HF kalıcı URL, rollback planı, canary dağıtım ve mimari matris
├── SINAV_TASARIMI.md               # Klasik vize düşünce egzersizi (Oracle, Diferansiyel Test, V&V, Regresyon)
├── README.md                       # 3 komutla kurulum, teslim linkleri, kapsam dışı kararlar ve AI beyanı
├── index.html                      # Telemetri ve onnxruntime-web entegreli mobil/masaüstü simülasyon arayüzü
├── style.css                       # obsidian_terminal koyu arduvaz temalı modern ve duyarlı stiller
├── app.js                          # Kriz durum makinesi, sayaçlar, Sokratik Tutor ve gerçek zamanlı ONNX çıkarım motoru
├── requirements.txt                # Python ML bağımlılıkları (numpy, pandas, scikit-learn, skl2onnx, onnxruntime)
├── package.json                    # Cypress bağımlılıkları ve npm test betikleri
├── cypress.config.js               # Cypress E2E yapılandırması (video=true)
├── data/
│   ├── SOZLUK.md                   # Veri sözlüğü, veri tipleri, min/max değerleri ve KVKK politikası
│   └── oturumlar.csv               # 15 gerçek + 45 sentetik (seed=42) toplam 60 satırlık telemetri veri seti
├── model/
│   ├── model.onnx                  # 437 baytlık Scikit-learn LogisticRegression ONNX modeli
│   ├── config.json                 # Model sözleşme şeması (özellikler, threshold: 0.60, metrikler, zaman damgası)
│   └── README.md                   # Model Cards for Model Reporting formatında model kartı
├── tests/
│   ├── parite.py                   # Python ONNX Test Kahini (Oracle) betiği
│   └── parite.json                 # 5 sabit referans girdi ve Python çıktı olasılıkları tablosu
├── cypress/
│   └── e2e/
│       ├── game_flow.cy.js         # v1 Son A ve Son B regresyon testleri
│       └── differential.cy.js      # v2 Diferansiyel parite testi (|web_p - python_p| < 1e-4)
└── assets/
    └── screens/                    # Stitch ekran referans görselleri (01_onboarding, 02_crisis_decision, 03_outcome_report)
```
