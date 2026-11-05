"""
The Primer v2: Bilisel Yuk ve Kriz Riski Tahmini -- Model Egitimi ve Paketleme (MLOps)

Bu betik:
1. 'data/oturumlar.csv' veri setini yukler.
2. Sabit tohum (random_state=42) ile %80 train / %20 test ayrimi yapar.
3. Scikit-learn LogisticRegression modeli egitir.
4. Test seti uzerinde Accuracy ve F1 skorunu hesaplar.
5. EVAL KAPISI (Gatekeeper): Accuracy >= 0.75 ve F1 >= 0.70 kosulunu denetler;
   saglanamazsa sys.exit(1) ile islemi durdurur ve hicbir artefakt uretmez.
6. Esik gecilirse skl2onnx ile 'model/model.onnx' uretir.
7. onnxruntime ile cikarim paritesini (fark < 1e-4) dogrular.
8. 'model/config.json' sozlesme semasini ve 'model/README.md' Model Card dosyasini yazar.
"""

import os
import sys
import json
from datetime import datetime, timezone

# Windows terminal cikis kodlamasini utf-8'e ayarla
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as ort

RANDOM_STATE = 42
DATA_PATH = os.path.join("data", "oturumlar.csv")
MODEL_DIR = "model"
MODEL_PATH = os.path.join(MODEL_DIR, "model.onnx")
CONFIG_PATH = os.path.join(MODEL_DIR, "config.json")
MODEL_CARD_PATH = os.path.join(MODEL_DIR, "README.md")

FEATURE_CONFIG = [
    {"name": "karar_suresi_sn", "type": "float", "unit": "saniye", "min": 1.0, "max": 65.0},
    {"name": "secim_degistirme_sayisi", "type": "int", "unit": "adet", "min": 0, "max": 6},
    {"name": "tutor_soru_sayisi", "type": "int", "unit": "adet", "min": 0, "max": 5},
    {"name": "sahne_no", "type": "int", "unit": "kategori", "min": 1, "max": 3},
    {"name": "deneyim_seviyesi", "type": "int", "unit": "binary", "min": 0, "max": 1},
]
FEATURE_NAMES = [f["name"] for f in FEATURE_CONFIG]
TARGET_NAME = "riskli_karar"

ACCURACY_GATE = 0.75
F1_GATE = 0.70
RISK_THRESHOLD = 0.60
MAX_PARITY_DIFF_TOLERANCE = 1e-4


def main():
    print("=" * 70)
    print("[INFO] THE PRIMER v2: ML EGITIM VE PAKETLEME (DEV & PACKAGING)")
    print("=" * 70)

    # 1. Veri Yukleme
    if not os.path.exists(DATA_PATH):
        print(f"[ERROR] Veri seti bulunamadi: {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"[DATA] Veri seti yuklendi: {len(df)} satir ({DATA_PATH})")

    real_count = int((df["kaynak"] == "gercek").sum())
    synth_count = int((df["kaynak"] == "sentetik").sum())
    print(f"   * Gercek Kayitlar:   {real_count} satir")
    print(f"   * Sentetik Kayitlar: {synth_count} satir")

    # Ozellik ve hedef ayrimi
    X = df[FEATURE_NAMES]
    y = df[TARGET_NAME]

    # 2. Train / Test Ayrimi (%80 train, %20 test, sabit seed=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )
    print(f"[SPLIT] Veri Ayrimi: {len(X_train)} train (%80), {len(X_test)} test (%20)")

    # 3. Model Egitimi (Scikit-learn LogisticRegression)
    model = LogisticRegression(random_state=RANDOM_STATE, max_iter=1000)
    model.fit(X_train, y_train)
    print("[TRAIN] Scikit-learn LogisticRegression modeli basariyla egitildi.")

    # 4. Test Seti Degerlendirmesi
    y_pred = model.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))

    print("\n[METRICS] TEST SETI DEGERLENDIRME METRIKLERI:")
    print(f"   * Accuracy:  {acc:.4f}  (Esik: >= {ACCURACY_GATE:.2f})")
    print(f"   * F1-Score:  {f1:.4f}  (Esik: >= {F1_GATE:.2f})")
    print(f"   * Precision: {prec:.4f}")
    print(f"   * Recall:    {rec:.4f}")

    # 5. EVAL GATE (Gatekeeper Kontrolu)
    print("\n[GATE] EVAL KAPISI (GATEKEEPER) KONTROLU:")
    if acc < ACCURACY_GATE or f1 < F1_GATE:
        print("[FAIL] EVAL KAPISI GECILEMEDI! Model kabul kriterlerini karsilamiyor.")
        print(f"       Gerekce: Accuracy={acc:.4f} < {ACCURACY_GATE} veya F1={f1:.4f} < {F1_GATE}")
        print("[ABORT] Guvenlik politikasi geregince model artefakti olusturulmayacak ve paketlenmeyecek!")
        sys.exit(1)

    print("[PASS] EVAL KAPISI GECILDI! Model altin standardi basariyla sagladi.")

    # 6. Model Klasorunun Hazirlanmasi
    os.makedirs(MODEL_DIR, exist_ok=True)

    # 7. skl2onnx ile ONNX Disa Aktarimi
    print("\n[EXPORT] ONNX FORMATINA DONUSTURULUYOR (skl2onnx)...")
    initial_type = [("float_input", FloatTensorType([None, len(FEATURE_NAMES)]))]
    # zipmap=False sayesinde tarayicida dogrudan float dizisi (olasilik tensoru) elde edilir
    onnx_model = convert_sklearn(
        model,
        initial_types=initial_type,
        options={"zipmap": False},
        target_opset=12,
    )

    with open(MODEL_PATH, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"[SAVED] ONNX modeli kaydedildi: {MODEL_PATH}")

    # 8. onnxruntime ile Cikarim Paritesi Dogrulamasi (Fark < 1e-4)
    print("\n[VERIFY] ONNX CIKARIM PARITESI DOGRULANIYOR (Oracle vs ONNX Runtime)...")
    ort_session = ort.InferenceSession(MODEL_PATH)

    # Test setini float32 formatinda onnxruntime'a besle
    input_name = ort_session.get_inputs()[0].name
    X_test_np = X_test.values.astype(np.float32)

    # Sklearn tahmin olasiliklari
    skl_probs = model.predict_proba(X_test)

    # ONNX Runtime tahmin olasiliklari
    ort_outs = ort_session.run(None, {input_name: X_test_np})
    onnx_probs = ort_outs[1]  # zipmap=False ile probabilities shape: [N, 2]

    # Mutlak maksimum fark hesaplama
    max_diff = float(np.max(np.abs(skl_probs - onnx_probs)))
    print(f"   * Sklearn vs ONNX Olasilik Farki (Max Absolute Diff): {max_diff:.8e}")

    if max_diff >= MAX_PARITY_DIFF_TOLERANCE:
        print(f"[FAIL] PARITE HATASI: Maksimum fark {max_diff} >= {MAX_PARITY_DIFF_TOLERANCE} toleransi asti!")
        sys.exit(1)

    print(f"[PASS] CIKARIM PARITESI DOGRULANDI (|diff| = {max_diff:.8e} < {MAX_PARITY_DIFF_TOLERANCE})")

    # 9. model/config.json Dosyasi (Sozlesme Semasi)
    timestamp_iso = datetime.now(timezone.utc).isoformat()
    config_data = {
        "model_name": "The Primer v2 - Bilisel Yuk ve Kriz Riski Tahmin Modeli",
        "version": "2.0.0",
        "framework": "scikit-learn (LogisticRegression)",
        "runtime": "onnxruntime-web (WebAssembly)",
        "created_at": timestamp_iso,
        "random_state": RANDOM_STATE,
        "decision_threshold": RISK_THRESHOLD,
        "input_tensor_name": input_name,
        "features": FEATURE_CONFIG,
        "target": {
            "name": TARGET_NAME,
            "type": "int",
            "classes": [
                {"value": 0, "label": "Dusuk Risk (Sakin / Bilincli)"},
                {"value": 1, "label": "Yuksek Kriz / Panik Riski"},
            ],
        },
        "evaluation_gate": {
            "accuracy_threshold": ACCURACY_GATE,
            "f1_threshold": F1_GATE,
            "parity_diff_tolerance": MAX_PARITY_DIFF_TOLERANCE,
            "status": "PASSED",
        },
        "metrics": {
            "accuracy": acc,
            "f1_score": f1,
            "precision": prec,
            "recall": rec,
            "max_parity_diff": max_diff,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        },
    }

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)
    print(f"[CONFIG] Model konfigurasyon sozlesmesi kaydedildi: {CONFIG_PATH}")

    # 10. model/README.md Dosyasi (Model Cards for Model Reporting Formatinda)
    model_card_content = f"""# Model Card: The Primer v2 — Bilişsel Yük ve Kriz Riski Tahmini

Bu model kartı, Mitchell ve ark. tarafından önerilen *"Model Cards for Model Reporting"* standart formatına uygun olarak hazırlanmıştır.

---

## 1. Model Detayları (Model Details)
- **Model Adı:** The Primer v2 Cognitive Load & Crisis Risk Predictor
- **Versiyon:** 2.0.0
- **Model Tipi:** İkili Sınıflandırma (Binary Classification) — Lojistik Regresyon (`LogisticRegression`)
- **Geliştirici:** The Primer v2 MLOps Takımı (YZM301)
- **Lisans:** MIT
- **Eğitim Tarihi:** {timestamp_iso}
- **Dağıtım Biçimi:** ONNX (`model/model.onnx`, opset 12, zipmap=False)
- **Hedef İstemci Çalışma Zamanı:** `onnxruntime-web` (WebAssembly tabanlı sıfır gecikmeli tarayıcı çıkarımı)

---

## 2. Kullanım Amacı (Intended Use)
- **Birincil Amaç:** Sabah 08:00 hastane randevu çöküş simülasyonunda öğrencilerin karar anındaki etkileşim telemetrisini (karar süresi, seçim değiştirme frekansı, Sokratik mentora danışma sayısı) gerçek zamanlı izleyerek **bilişsel yük ve kriz riskini ($p \\ge 0.60$)** tahmin etmek.
- **Pedagojik Entegrasyon:** Risk olasılığı $p \\ge 0.60$ olduğunda arayüzde *"Telemetry: Yüksek Risk / Bilişsel Yük"* rozeti tetiklenir ve Sokratik AI Tutor öğrencinin telaşını yatıştırmak ve neden-sonuç bağlamını düşündürmek için **proaktif soru** sorar.
- **Kapsam Dışı Kullanım:** Öğrenciye not veya performans cezası vermek amacıyla kullanılamaz; sadece biçimlendirici (formative) destek sağlar.

---

## 3. Veri Dağılımı ve Faktörler (Factors & Data Distribution)
Model, `data/oturumlar.csv` veri seti üzerinde eğitilmiştir:
- **Toplam Oturum Sayısı:** {len(df)} satır (%80 Eğitim: {len(X_train)}, %20 Test: {len(X_test)})
- **Gerçek Kullanıcı Oturumları:** {real_count} satır (3 farklı öğrenci profili x 5 kriz oturumu)
- **Sentetik Telemetri:** {synth_count} satır (`seed=42` tohumlu kurallı sentetik kriz verisi)

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
| **Accuracy (Doğruluk)** | **{acc:.4f}** | $\\ge 0.75$ | **GEÇTİ (PASSED)** |
| **F1-Score** | **{f1:.4f}** | $\\ge 0.70$ | **GEÇTİ (PASSED)** |
| **Precision** | {prec:.4f} | - | Bilgi |
| **Recall** | {rec:.4f} | - | Bilgi |
| **ONNX Parite Farkı ($|p_{{skl}} - p_{{onnx}}|$)** | **{max_diff:.2e}** | $< 1.00 \\times 10^{{-4}}$ | **GEÇTİ (PASSED)** |

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
"""

    with open(MODEL_CARD_PATH, "w", encoding="utf-8") as f:
        f.write(model_card_content)
    print(f"[CARD] Model Card belgesi kaydedildi: {MODEL_CARD_PATH}")

    print("\n" + "=" * 70)
    print("[SUCCESS] ML YASAM DONGUSU EGITIM VE PAKETLEME TAMAMLANDI!")
    print(f"          Artefaktlar: {MODEL_PATH}, {CONFIG_PATH}, {MODEL_CARD_PATH}")
    print("=" * 70)


if __name__ == "__main__":
    main()
