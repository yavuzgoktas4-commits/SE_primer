# Veri Sözlüğü ve Veri Yönetişim Dokümanı (`data/SOZLUK.md`)

## 1. Veri Seti Özeti
**The Primer v2** simülasyonunda toplanan bu veri seti (`data/oturumlar.csv`), kriz yönetimi esnasında öğrencilerin karar anındaki bilişsel yükünü ve panik/riskli karar alma eğilimlerini makine öğrenmesi (ML) modelleri ile tahmin etmek üzere tasarlanmıştır.

Her bir kayıt (satır), kullanıcının simülasyon içerisindeki belirli bir kriz sahnesinde (Karar 1: Mimari, Karar 2: Test veya Karar 3: KVKK) sergilediği etkileşim telemetrisini ve üretilen risk etiketini temsil eder.

---

## 2. KVKK ve Veri Mahremiyeti Politikası
6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve GDPR prensiplerine tam uyum gereğince:
1. **Sıfır Kişisel Veri (Zero PII):** Ad, soyad, T.C. kimlik numarası, e-posta, IP adresi veya cihaz parmak izi gibi doğrudan ya da dolaylı olarak bir bireyi tanımlayabilecek hiçbir veri toplanmaz ve saklanmaz.
2. **Kriptografik ve Anonim Tanımlayıcılar:** `oturum_id` ve `kullanici_id` alanları istemci tarafında rastgele üretilen anonim **UUID v4** standartlarındadır; hiçbir kullanıcı veritabanı veya kimlik doğrulama profili ile ilişkilendirilemez.
3. **Eğitim ve Araştırma Amacı:** Veriler yalnızca Sokratik AI Tutor'un proaktif adaptasyonunu ve öğrencinin kriz anındaki karar kalitesini desteklemek üzere istemci tabanlı (client-side ONNX Runtime) çıkarım için işlenir.

---

## 3. Öznitelik (Feature) ve Hedef Değişken Sözlüğü

| Sütun Adı | Veri Tipi | Birim / Format | Min | Max | ML Rolü | Açıklama ve Anlamı |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `oturum_id` | String | UUID v4 | - | - | Metadata | Kriz simülasyonu oturumunun benzersiz rastgele kimliği. |
| `kullanici_id` | String | UUID v4 | - | - | Metadata | Anonimleştirilmiş tekil kullanıcı/cihaz oturum belirteci. |
| `sahne_no` | Integer | Kategori (Sıralı) | `1` | `3` | Girdi (Feature) | Aktif kriz karar aşaması: <br>• `1`: Mimari (Rollback vs Hotfix)<br>• `2`: Test (Smoke Test vs Canlıya Al)<br>• `3`: KVKK (Maskele vs Açık Paylaş) |
| `deneyim_seviyesi` | Integer | Binary Kod | `0` | `1` | Girdi (Feature) | Kullanıcının başlangıç profili: <br>• `0`: Yeni Başladım (İpuçları Açık)<br>• `1`: Deneyimliyim (60 sn sayaç aktif) |
| `karar_suresi_sn` | Float | Saniye (sn) | `1.20` | `65.00` | Girdi (Feature) | Sahne açıldıktan karar butonuna basılana kadar geçen süre. |
| `secim_degistirme_sayisi` | Integer | Adet | `0` | `6` | Girdi (Feature) | Kullanıcının A ve B şıkları arasında kararsız kalıp yaptığı tıklama/değiştirme sayısı. |
| `tutor_soru_sayisi` | Integer | Adet | `0` | `5` | Girdi (Feature) | İlgili karar anında AI Tutor sohbet kutusuna yazılan veya çip ile sorulan soru adedi. |
| `riskli_karar` | Integer | Binary (0 / 1) | `0` | `1` | **Hedef (Target)** | **Model Hedefi:** <br>• `0`: Düşük Risk (Bilinçli, kararlı mühendislik seçimi)<br>• `1`: Yüksek Kriz / Panik Riski (Hatalı, telaşlı veya KVKK ihlali potansiyeli yüksek seçim) |
| `kaynak` | String | Kategorik | - | - | Yönetişim | Verinin elde ediliş türü: <br>• `gercek`: Gözlemlenen gerçek kullanıcı oturumları (3 kişi x 5 oturum)<br>• `sentetik`: `seed=42` ile kurallı dağılımlardan üretilmiş sentetik telemetri |

---

## 4. Öznitelik Mühendisliği ve Davranışsal Karakteristikler
- **Bilişsel Yük ve Panik Belirteçleri:**
  - `deneyim_seviyesi = 1` iken `karar_suresi_sn < 4.0` sn (aceleci dürtüsel seçim) veya `karar_suresi_sn > 50.0` sn (sayaç baskısı altında kilitlenme).
  - `secim_degistirme_sayisi >= 2` (kararsızlık ve bilişsel çelişki).
  - `tutor_soru_sayisi >= 2` iken yüksek kararsızlık (`secim_degistirme_sayisi > 1`).
- Bu parametreler birleştiğinde model `riskli_karar = 1` tahmininde bulunur ve Sokratik AI Tutor'un proaktif olarak devreye girmesi sağlanır.
