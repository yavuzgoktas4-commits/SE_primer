import csv
import random
import uuid

# Tohum belirlenir (tekrarlanabilirlik için seed=42)
random.seed(42)

# Gerçek kullanıcı UUID'leri (3 farklı kullanıcı)
user_ids = [
    "c8a14b09-7d63-4819-bf93-01934e8f1001",  # Kullanıcı 1 (Yeni Başlayan - Temkinli)
    "e2f93d14-3a55-46b7-84ec-89b12d5e2002",  # Kullanıcı 2 (Deneyimli - Hızlı ve Kararlı)
    "95d73b22-1e90-4c17-a511-37d45c8b3003",  # Kullanıcı 3 (Deneyimli - Süre Baskısıyla Panikleyen)
]

rows = []

# 1. GERÇEK KULLANICI OTURUMLARI (3 kullanıcı x 5 oturum = 15 satır)
# Kullanıcı 1 (Yeni Başlayan, ipuçları açık, tutor'a soru sorar, sakin, düşük risk)
u1_sessions = [
    # sahne_no, deneyim, sure, secim_degistirme, tutor_soru, risk
    (1, 0, 14.50, 0, 1, 0),
    (2, 0, 18.20, 1, 2, 0),
    (3, 0, 12.80, 0, 1, 0),
    (1, 0, 22.40, 1, 1, 0),
    (3, 0, 16.10, 0, 2, 0),
]
for scene, exp, dur, toggles, questions, risk in u1_sessions:
    rows.append({
        "oturum_id": str(uuid.UUID(int=random.getrandbits(128), version=4)),
        "kullanici_id": user_ids[0],
        "sahne_no": scene,
        "deneyim_seviyesi": exp,
        "karar_suresi_sn": dur,
        "secim_degistirme_sayisi": toggles,
        "tutor_soru_sayisi": questions,
        "riskli_karar": risk,
        "kaynak": "gercek",
    })

# Kullanıcı 2 (Deneyimli, hızlı, kendinden emin, düşük risk)
u2_sessions = [
    (1, 1, 6.40, 0, 0, 0),
    (2, 1, 8.10, 0, 0, 0),
    (3, 1, 7.50, 0, 0, 0),
    (1, 1, 9.20, 0, 1, 0),
    (2, 1, 5.80, 0, 0, 0),
]
for scene, exp, dur, toggles, questions, risk in u2_sessions:
    rows.append({
        "oturum_id": str(uuid.UUID(int=random.getrandbits(128), version=4)),
        "kullanici_id": user_ids[1],
        "sahne_no": scene,
        "deneyim_seviyesi": exp,
        "karar_suresi_sn": dur,
        "secim_degistirme_sayisi": toggles,
        "tutor_soru_sayisi": questions,
        "riskli_karar": risk,
        "kaynak": "gercek",
    })

# Kullanıcı 3 (Deneyimli, sayaç baskısı altında panikleyen, çok tıklayan, yüksek risk)
u3_sessions = [
    (1, 1, 2.10, 2, 0, 1),   # Aşırı aceleci dürtüsel hotfix
    (1, 1, 56.40, 3, 2, 1),  # Süre bitimine 3 saniye kala panikle karar değiştirme
    (2, 1, 3.20, 2, 0, 1),   # Testi atlayıp hemen canlıya alma refleksi
    (3, 1, 54.10, 4, 3, 1),  # KVKK aşamasında sürenin bitmesiyle açık log atma
    (3, 1, 1.80, 1, 0, 1),   # Aceleyle maskelemeyi atlama
]
for scene, exp, dur, toggles, questions, risk in u3_sessions:
    rows.append({
        "oturum_id": str(uuid.UUID(int=random.getrandbits(128), version=4)),
        "kullanici_id": user_ids[2],
        "sahne_no": scene,
        "deneyim_seviyesi": exp,
        "karar_suresi_sn": dur,
        "secim_degistirme_sayisi": toggles,
        "tutor_soru_sayisi": questions,
        "riskli_karar": risk,
        "kaynak": "gercek",
    })

# 2. SENTETİK KURAL TABANLI OTURUMLAR (45 satır, tohumlu seed=42)
for _ in range(45):
    # Rastgele kullanıcı UUID
    synthetic_user = str(uuid.UUID(int=random.getrandbits(128), version=4))
    scene = random.choice([1, 2, 3])
    exp = random.choice([0, 1])

    # Kural tabanlı profil dağılımı
    is_panic = random.random() < 0.45

    if is_panic:
        # Panik / Bilişsel yük yüksek senaryo:
        # Ya çok aceleci (< 4 sn) ya da süre sınırına yakın (> 48 sn), çoklu tıklama
        if random.random() < 0.5:
            dur = round(random.uniform(1.2, 4.0), 2)
        else:
            dur = round(random.uniform(48.0, 62.0), 2)
        toggles = random.randint(2, 5)
        questions = random.randint(1, 4)
        risk = 1
    else:
        # Kararlı / Düşük risk senaryo:
        # Makul süre (8 - 30 sn), az veya hiç buton değiştirme
        dur = round(random.uniform(8.0, 32.0), 2)
        toggles = random.choice([0, 0, 1])
        questions = random.choice([0, 1, 1, 2])
        risk = 0

    rows.append({
        "oturum_id": str(uuid.UUID(int=random.getrandbits(128), version=4)),
        "kullanici_id": synthetic_user,
        "sahne_no": scene,
        "deneyim_seviyesi": exp,
        "karar_suresi_sn": dur,
        "secim_degistirme_sayisi": toggles,
        "tutor_soru_sayisi": questions,
        "riskli_karar": risk,
        "kaynak": "sentetik",
    })

# CSV Dosyasına Yazma
fields = [
    "oturum_id",
    "kullanici_id",
    "sahne_no",
    "deneyim_seviyesi",
    "karar_suresi_sn",
    "secim_degistirme_sayisi",
    "tutor_soru_sayisi",
    "riskli_karar",
    "kaynak",
]

csv_path = "data/oturumlar.csv"
with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

print(f"Toplam {len(rows)} satır veri başarıyla üretildi ve '{csv_path}' dosyasına yazıldı.")
real_count = sum(1 for r in rows if r['kaynak'] == 'gercek')
synth_count = sum(1 for r in rows if r['kaynak'] == 'sentetik')
print(f"Gerçek Satır Sayısı: {real_count}, Sentetik Satır Sayısı: {synth_count}")
