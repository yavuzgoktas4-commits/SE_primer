# Sizinle Uyumlanan Sınav Tasarımı: Yazılım Kalite ve Makine Öğrenmesi Test Mühendisliği

> **Ders:** YZM301 Yazılım Mühendisliği & Makine Öğrenmesi Yaşam Döngüsü (MLOps)  
> **Modül:** Vizeye Hazırlık Düşünce Egzersizi ve Kritik Muhakeme Sorusu  
> **Süre:** 35 Dakika | **Puan:** 25 Puan

---

## 1. Senaryo Sorusu (Klasik Sınav Sorusu)

**Senaryo:**  
Bir şehir hastanesinin acil servis polikliniğinde kullanılan *"Triyaj ve Randevu Yönetim Sistemi"* için geliştirici ekibiniz, yoğun kriz anlarında doktorların aşırı bilişsel yükünü ve panik halinde hatalı reçete/sevk yazma riskini önceden tahmin eden tabular bir sınıflandırma modeli geliştirmiştir. 

Model, Python ortamında Scikit-learn ile eğitilmiş; ardından hastanedeki acil servis tabletlerinde ve web tarayıcılarında çevrimdışı (offline) çalışabilmesi için **ONNX** formatına dönüştürülerek JavaScript (`onnxruntime-web`) katmanına entegre edilmiştir.

Başmühendis olarak kalite güvence (QA) toplantısında şu durumu tespit ediyorsunuz:  
> *"Eğitilen model test setinde %92 doğruluk (accuracy) vermektedir. Ancak web tarayıcısında çalışan JavaScript arayüzü ile Python geliştirme ortamının ürettiği risk olasılıkları arasında bazı kritik hastalarda $0.000085$ ($8.5 \times 10^{-5}$), bazı durumlarda ise $0.012$ ($1.2 \times 10^{-2}$) seviyesinde sayısal sapmalar gözlenmektedir. Ayrıca geçen ay devreye alınan acil kan nakli onay modülü, bu yeni modelin entegrasyonu sonrasında nadiren de olsa yanıt vermeyi durdurmaktadır."*

### Sizden İstenenler (Sorular):
1. **(7 Puan) Diferansiyel Test ve Test Kahini (Oracle):** Bu sistemde geleneksel yazılım testlerindeki gibi insan yapımı bir *"Test Kahini (Oracle)"* bulunabilir mi? Neden diferansiyel test yöntemine başvurulmuştur? Python çalışma zamanı ile Web ONNX çalışma zamanı arasındaki farkı denetlerken neden doğrudan eşitlik (`assert p_web == p_python`) yerine **$10^{-4}$ hata toleransı** belirlenmiştir? Donanım ve mimari açıdan gerekçelendiriniz.
2. **(6 Puan) Doğrulama (Verification) ve Geçerleme (Validation - V&V):** Eğitilen modelin test setinde %92 doğruluk vermesi ve diferansiyel parite testinden geçmesi bu yazılımın *"Geçerlendiği (Validated)"* anlamına gelir mi? Acil servis ortamını düşünerek Doğrulama ve Geçerleme arasındaki farkı bu senaryo üzerinde açıklayınız.
3. **(6 Puan) Regresyon Testi:** Yeni makine öğrenmesi modelinin eklenmesiyle daha önce sorunsuz çalışan *"acil kan nakli onay modülü"*nün aksaması yazılım mühendisliğinde hangi risk türüdür? Bu durumun üretim ortamına (production) sızmasını engellemek için CI/CD hattına nasıl bir regresyon güvenlik ağı kurulmalıdır?
4. **(6 Puan) Kritik Çeldiriciler ve Yanılgı Analizi:** Bir stajyer mühendisin *"Madem model test setinde %92 başarılı, tarayıcıda onnxruntime yerine doğrudan aynı formülü JavaScript `Math.exp()` ile elle yazalım, hiçbir teste gerek kalmaz"* önerisindeki 2 kritik kavramsal yanılgıyı açıklayınız.

---

## 2. Beklenen İdeal Cevap Anahtarı (Rubrik)

### Soru 1: Test Kahini, Diferansiyel Test ve Hata Toleransı ($10^{-4}$)
- **Test Kahini Problemi (Oracle Problem):** Sürekli değişen karmaşık acil servis verilerinde (ör. doktorun anlık tıklama hızı, karar süresi, hasta nabzı) üretilen karmaşık olasılık fonksiyonunun (ör. $p = 0.618429$) matematiksel olarak "kesin doğru" cevabını bir insanın tek tek elle önceden hesaplayıp test beklentisi olarak yazması imkansızdır (Test Oracle Problem).
- **Diferansiyel Test Rolü:** Kesin bir insan kahini olmadığı için sistemin bilinen referans uygulaması (Python Scikit-learn/ONNX) **referans kahin (pseudo-oracle)** kabul edilir ve hedef sistemle (WebAssembly ONNX) aynı girdiler için paralel koşturulup çıktıları diferansiyel olarak kıyaslanır.
- **$10^{-4}$ Hata Toleransının Donanımsal Gerekçesi:**
  - Python (C/C++ SIMD x86_64, FMA talimatları ve 64-bit çift duyarlıklı kayan nokta `float64`) ile tarayıcıdaki WebAssembly / JavaScript V8 motoru (32-bit tek duyarlıklı `float32`, derleyici optimizasyonları ve kayan nokta yuvarlama farkları) IEEE 754 standardında bit düzeyinde birebir örtüşmez.
  - `p_web == p_python` testi derleyici optimizasyonları nedeniyle kaçınılmaz olarak çöker. $10^{-4}$ toleransı, mantıksal karar sınırını ($p \ge 0.60$) etkilemeyecek kadar dar, fakat kayan nokta yuvarlama gürültüsünü tolere edecek kadar gerçekçi mühendislik standardıdır.

### Soru 2: Doğrulama (Verification) vs. Geçerleme (Validation - V&V)
- **Doğrulama ("Sistemi doğru mu üretiyoruz?"):** Modelin şartnamedeki matematiksel gereksinimlere, girdi-çıktı sözleşmesine (`config.json`) ve parite toleransına ($< 10^{-4}$) uygun çalıştığını teyit eder. Diferansiyel test ve test seti metrikleri birer **Doğrulama (Verification)** adımıdır.
- **Geçerleme ("Doğru sistemi mi üretiyoruz?"):** Sistemin acil servisteki doktorun ve hastaların gerçek klinik ihtiyaçlarını çözüp çözmediğidir.
- **Fark:** Model %92 doğrulukla ve sıfır parite farkıyla çalışsa dahi, acil serviste aşırı yanlış alarmlarla doktorun dikkatini dağıtıyor veya kritik bir hastada hekimi yavaşlatıyorsa sistem **doğrulanmış ancak GEÇERLENEMEMİŞTİR (Invalid)**.

### Soru 3: Regresyon Riski ve CI/CD Güvenlik Ağı
- **Risk Türü:** Fonksiyonel ve yan etki kaynaklı **Yazılım Regresyonu (Regression Defect)**. Yeni bir ML bağımlılığının veya asenkron olay döngüsünün (event-loop starvation), ana uygulamanın kritik iş mantığını (kan nakli onayı) bozması durumudur.
- **CI/CD Güvenlik Ağı Çözümü:**
  - **Uçtan Uca (E2E) Regresyon Test Paketi:** Model güncellemesi veya paketlemesi içeren her Pull Request'te, sadece ML testleri değil, geçmiş haftalardan kalan tüm temel iş akışlarını kapsayan Cypress E2E testleri (`npm run test:e2e`) zorunlu kapı (blocking gate) olarak çalıştırılmalıdır.
  - **İzolasyon (Worker/Thread Separation):** ONNX çıkarımı Web Worker içine taşınarak ana UI ve kan onay akışının tek iş parçacıklı (single-threaded) JavaScript ortamında bloke olması önlenmelidir.

### Soru 4: Kritik Çeldiriciler ve Kavram Yanılgıları Analizi
1. **Yanılgı 1 (Model Taşınabilirliği ve Şema İhlali):** Modeli koda elle yazmak (`hardcoding`), Scikit-learn'deki ön işleme, katsayı standardizasyonu ve opset güncellemelerini kırar. Model yeniden eğitildiğinde kod tabanı teknik borca gömülür; açık standart (ONNX) kullanmanın sağladığı yeniden üretilebilirlik ve CI/CD otomasyonu yok edilir.
2. **Yanılgı 2 (Test İhtiyacını İnkar Etme):** Farklı JavaScript motorlarında (V8, JavaScriptCore, SpiderMonkey) `Math.exp()` fonksiyonunun transandantal hesaplama hassasiyeti farklılık gösterir. Diferansiyel test kaldırılırsa, üretimdeki bir tarayıcıda sınır vakalarda ($p = 0.5999$ vs $p = 0.6001$) hastaya müdahale alarmının çalmaması gibi ölümcül hatalar tespit edilemez.

---

## 3. Puanlama Anahtarı ve Değerlendirme Özeti

| Soru Maddesi | Temel Başarı Kriteri | Puan |
| :--- | :--- | :---: |
| **1. Oracle & Parite** | Test Kahini problemini açıklama (3p) + Diferansiyel test gerekçesi (2p) + IEEE 754 donanım/float toleransı analizi (2p) | **7 Puan** |
| **2. Doğrulama vs Geçerleme** | Doğrulama tanımı (2p) + Geçerleme tanımı (2p) + Klinik bağlamda somut örnekle ayrım (2p) | **6 Puan** |
| **3. Regresyon Testi** | Regresyon riskini tanımlama (2p) + CI/CD'de bloklayıcı E2E koşumu ve izolasyon önerisi (4p) | **6 Puan** |
| **4. Çeldirici Analizi** | ONNX soyutlama kaybı ve MLOps borcu (3p) + Çapraz tarayıcı kayan nokta hesaplama riski (3p) | **6 Puan** |
| **TOPLAM** | **Akademik Değerlendirme Skoru** | **25 Puan** |
