# Model Card: The Primer v2 — Bilişsel Yük ve Kriz Riski Tahmini

Bu model kartı, Mitchell ve ark. tarafından önerilen *"Model Cards for Model Reporting"* standart formatına uygun olarak hazırlanmıştır.

---

## 1. Model Detayları (Model Details)
- **Model Adı:** The Primer v2 Cognitive Load & Crisis Risk Predictor
- **Versiyon:** 2.0.0
- **Model Tipi:** İkili Sınıflandırma (Binary Classification) — Lojistik Regresyon (`LogisticRegression`)
- **Geliştirici:** The Primer v2 MLOps Takımı (YZM301)
- **Lisans:** MIT
- **Eğitim Tarihi:** 2026-11-05T21:37:28.296699+00:00
- **Dağıtım Biçimi:** ONNX (`model/model.onnx`, opset 12, zipmap=False)
- **Hedef İstemci Çalışma Zamanı:** `onnxruntime-web` (WebAssembly tabanlı sıfır gecikmeli tarayıcı çıkarımı)

---

## 2. Kullanım Amacı (Intended Use)
- **Birincil Amaç:** Sabah 08:00 hastane randevu çöküş simülasyonunda öğrencilerin karar anındaki etkileşim telemetrisini (karar süresi, seçim değiştirme frekansı, Sokratik mentora danışma sayısı) gerçek zamanlı izleyerek **bilişsel yük ve kriz riskini ($p \ge 0.60$)** tahmin etmek.
- **Pedagojik Entegrasyon:** Risk olasılığı $p \ge 0.60$ olduğunda arayüzde *"Telemetry: Yüksek Risk / Bilişsel Yük"* rozeti tetiklenir ve Sokratik AI Tutor öğrencinin telaşını yatıştırmak ve neden-sonuç bağlamını düşündürmek için **proaktif soru** sorar.
- **Kapsam Dışı Kullanım:** Öğrenciye not veya performans cezası vermek amacıyla kullanılamaz; sadece biçimlendirici (formative) destek sağlar.

---

## 3. Veri Dağılımı ve Faktörler (Factors & Data Distribution)
Model, `data/oturumlar.csv` veri seti üzerinde eğitilmiştir:
- **Toplam Oturum Sayısı:** 60 satır (%80 Eğitim: 48, %20 Test: 12)
- **Gerçek Kullanıcı Oturumları:** 15 satır (3 farklı öğrenci profili x 5 kriz oturumu)
- **Sentetik Telemetri:** 45 satır (`seed=42` tohumlu kurallı sentetik kriz verisi)

### Girdi Özellikleri (Inputs)
1. `karar_suresi_sn` (float): Sahne açılışından itibaren geçen saniye (`1.0` - `65.0`).
2. `secim_degistirme_sayisi` (int): A ve B şıkları arasındaki kararsız tıklama adedi (`0` - `6`).
3. `tutor_soru_sayisi` (int): Sokratik mentora sorulan soru adedi (`0` - `5`).
4. `sahne_no` (int): Karar aşaması (1: Mimari, 2: Test, 3: KVKK).
5. `deneyim_seviyesi` (int): 0: Yeni Başladım, 1: Deneyimliyim (60 sn sayaçlı mod).

---

## 4. Değerlendirme ve Eval Kapısı (Metrics & Evaluation Gate)
Sistem şartnamesinde (`spec.md`) tanımlanan **Altın Standart (Eval Gate)** gereğince test seti metrikleri bağımsız olarak denetlenmiştir:

| Metrik | Model Sonucu | Eval Kapısı Eşiği | Durum |
| :--- | :---: | :---: | :---: |
| **Accuracy (Doğruluk)** | **1.0000** | $\ge 0.75$ | **GEÇTİ (PASSED)** |
| **F1-Score** | **1.0000** | $\ge 0.70$ | **GEÇTİ (PASSED)** |
| **Precision** | 1.0000 | - | Bilgi |
| **Recall** | 1.0000 | - | Bilgi |
| **ONNX Parite Farkı ($|p_{skl} - p_{onnx}|$)** | **6.33e-08** | $< 1.00 \times 10^{-4}$ | **GEÇTİ (PASSED)** |

---

## 5. Sınırlar ve Riskler (Limitations)
- Model, 3 adımlı randevu sistemi kriz senaryosu sınırları için optimize edilmiştir.
- 60 saniyeden uzun süre pasif bekleyen veya sekmeden ayrılan (idle) kullanıcılar için telemetri zaman aşımı (timeout) uygulanmalıdır.
- Model, doğrudan doğru şıkkı tahmin etmez; yalnızca mühendisin bilişsel panik eğilimini sınıflandırır.

---

## 6. Etik Mülahazalar ve KVKK Uyumu (Ethical Considerations)
- **Sıfır PII Garantisi:** Kişisel veri (ad, soyad, TC no, IP, konum) toplanmaz.
- **Kriptografik Anonimlik:** Tüm oturumlar rastgele UUID v4 ile temsil edilir.
- **Şeffaf Mentorluk:** Model kararı öğrencinin erişimini engellemez, yalnızca Sokratik Tutor desteğini proaktif hale getirir.
