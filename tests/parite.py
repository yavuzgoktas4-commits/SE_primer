"""
The Primer v2: Python Test Kahini (Oracle) ve Diferansiyel Parite Testi

Bu betik:
1. Sabit 5 referans girdi tanımlar:
   [karar_suresi_sn, secim_degistirme_sayisi, tutor_soru_sayisi, sahne_no, deneyim_seviyesi]
2. 'model/model.onnx' modelini onnxruntime ile çalıştırır.
3. Her referans girdi için sınıf-1 (riskli_karar) olasılığını float olarak hesaplar.
4. Girdileri ve Python referans çıktılarını 'tests/parite.json' dosyasına kaydeder.
"""

import os
import sys
import json
import numpy as np
import onnxruntime as ort

MODEL_PATH = os.path.join("model", "model.onnx")
OUTPUT_PATH = os.path.join("tests", "parite.json")

# Sabit 5 Referans Girdi
# Sıralama: [karar_suresi_sn, secim_degistirme_sayisi, tutor_soru_sayisi, sahne_no, deneyim_seviyesi]
REFERENCE_INPUTS = [
    {
        "id": 1,
        "name": "Sakin Yeni Baslayan (Dusuk Risk)",
        "features": [14.5, 0, 1, 1, 0],
    },
    {
        "id": 2,
        "name": "Kararli Deneyimli (Dusuk Risk)",
        "features": [8.0, 0, 0, 2, 1],
    },
    {
        "id": 3,
        "name": "Sure Baskisiyla Panikleyen (Yuksek Risk)",
        "features": [55.0, 3, 2, 1, 1],
    },
    {
        "id": 4,
        "name": "Durtusel ve Kararsiz (Yuksek Risk)",
        "features": [2.5, 2, 0, 2, 1],
    },
    {
        "id": 5,
        "name": "KVKK Asamasinda Coklu Tiklama (Yuksek Risk)",
        "features": [52.0, 4, 3, 3, 1],
    },
]


def main():
    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] ONNX modeli bulunamadı: {MODEL_PATH}")
        sys.exit(1)

    session = ort.InferenceSession(MODEL_PATH)
    input_name = session.get_inputs()[0].name

    results = []
    print("=" * 65)
    print("[ORACLE] PYTHON ONNX TEST KAHİNİ (tests/parite.py)")
    print("=" * 65)

    for item in REFERENCE_INPUTS:
        feat_array = np.array([item["features"]], dtype=np.float32)
        outs = session.run(None, {input_name: feat_array})
        # outs[1] shape: [1, 2] -> [P(y=0), P(y=1)]
        prob_class_1 = float(outs[1][0, 1])
        prob_class_0 = float(outs[1][0, 0])

        item_result = {
            "id": item["id"],
            "name": item["name"],
            "features": item["features"],
            "python_p": prob_class_1,
            "python_p0": prob_class_0,
            "predicted_class": int(prob_class_1 >= 0.60),
        }
        results.append(item_result)
        print(f"[{item['id']}] {item['name']:<45} -> p = {prob_class_1:.8f}")

    output_data = {
        "model": "model/model.onnx",
        "tolerance": 0.0001,
        "reference_inputs": results,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Referans veriler başarıyla kaydedildi: {OUTPUT_PATH}")
    print("=" * 65)


if __name__ == "__main__":
    main()
