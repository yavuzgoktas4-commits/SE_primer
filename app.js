/**
 * SE Primer — YZM301 Kriz Simülasyonu Uygulama Mantığı
 * - Başlangıç: 08:00 randevu sistemi çöktü, 300 hasta bekliyor.
 * - 3 Girdi: Seviye (Yeni/Deneyimli), Rol (Frontend/Backend/Fullstack), Hedef (Hızlı kurtarma/Sıfır veri kaybı).
 * - "Yeni başladım" -> Teknik ipuçları açık.
 * - "Deneyimliyim" -> 60 saniyelik geri sayım sayacı başlar.
 * - 3 Karar: Mimari, Test, KVKK. Her seçimde "Ne oldu?" ve "Neden oldu?" gösterilir.
 * - Sonuç: Karar 3 A -> "Son A · İYİ: 08:25 sistem ayakta, veri güvende"
 *          Karar 3 B -> "Son B · KÖTÜ: Sistem ayakta ama KVKK ihlali"
 * - Sokratik AI Tutor: Doğrudan şık/cevap vermez, yönlendirici soru sorar.
 */

const gameState = {
  started: false,
  level: 'Yeni',
  role: 'Backend',
  goal: 'Sıfır veri kaybı',
  currentStep: 1,
  choices: {
    1: null,
    2: null,
    3: null,
  },
  remainingSeconds: 60,
  timerInterval: null,
};

// Her karar için "Ne oldu?" ve "Neden oldu?" teknik açıklamaları
const DECISION_EXPLANATIONS = {
  1: {
    A: {
      what: 'Ne oldu?: Sistem v2.3.9 kararlı sürümüne 2 dakika içinde geri alındı (rollback). Randevu servisi HTTP 200 dönmeye başladı ve kuyruk erimeye geçti.',
      why: 'Neden oldu?: Üretim krizi anında bilinen sağlam bir artefakta (artifact) geri dönmek, belirsizliği ortadan kaldırır ve Ortalama Kurtarma Süresini (MTTR) minimize eder.',
    },
    B: {
      what: 'Ne oldu?: Canlı sunucu üzerinde acil yama (hotfix) denendi. İlk denemede bağımlılık hatası çıktı, ikinci müdahaleyle servis kısmen ayağa kalktı ancak 10 dakika kaybedildi.',
      why: 'Neden oldu?: Canlı ortamda stres altında yazılan kod, derleme ve entegrasyon adımlarını atladığı için öngörülemeyen yan etkilere (side-effect) açıktır.',
    },
  },
  2: {
    A: {
      what: 'Ne oldu?: 3 dakikalık otomatik kısa test (smoke test) koşuldu. Veritabanı bağlantı havuzu (connection pool) sızıntısı yakalanıp düzeltildi ve paket güvenle yayına alındı.',
      why: 'Neden oldu?: Smoke testler, dağıtım öncesi sistemin en kritik işlevlerini (randevu alma, DB yazma) doğrulayarak regresyon kaynaklı ikinci bir çöküşü engeller.',
    },
    B: {
      what: 'Ne oldu?: Test adımı atlanarak paket doğrudan canlıya alındı. İlk 50 hastadan sonra bağlantı havuzu doldu ve servis kısa süreliğine tekrar yavaşladı.',
      why: 'Neden oldu?: Doğrulanmamış kodu hız uğruna doğrudan üretime almak, gizli konfigürasyon hatalarının son kullanıcıya yansımasına yol açar.',
    },
  },
  3: {
    A: {
      what: 'Ne oldu?: Log çıktısındaki hasta adı ("Ayşe Yılmaz") ve T.C. Kimlik No alanları maskelenerek (`***`) ekip kanalında paylaşıldı. Hata hızla giderildi.',
      why: 'Neden oldu?: KVKK ve Veri Minimizasyonu ilkesi gereği, hata ayıklama (debugging) için gerçek kişisel verilere (PII) ihtiyaç yoktur; maskeleme hem mahremiyeti hem de hukuki uyumu korur.',
    },
    B: {
      what: 'Ne oldu?: Hasta adı ve T.C. kimlik numarası içeren ham log kaydı doğrudan genel mesajlaşma kanalına atıldı. Hata çözüldü ancak kişisel sağlık verisi sızmış oldu.',
      why: 'Neden oldu?: 6698 sayılı KVKK kapsamında sağlık ve kimlik verilerinin yetkisiz erişime açık kanallarda maskelenmeden paylaşılması doğrudan veri ihlali oluşturur.',
    },
  },
};

// DOM Elemanları
const levelSelect = document.getElementById('level-select');
const roleSelect = document.getElementById('role-select');
const goalSelect = document.getElementById('goal-select');
const startGameBtn = document.getElementById('start-game-btn');

const hintModeBadge = document.getElementById('hint-mode-badge');
const timerBadge = document.getElementById('timer-badge');
const countdownValue = document.getElementById('countdown-value');
const crisisClock = document.getElementById('crisis-clock');

const profileSummaryBar = document.getElementById('profile-summary-bar');
const summaryLevel = document.getElementById('summary-level');
const summaryRole = document.getElementById('summary-role');
const summaryGoal = document.getElementById('summary-goal');

const decisionsContainer = document.getElementById('decisions-container');
const decisionCards = {
  1: document.getElementById('decision-1-card'),
  2: document.getElementById('decision-2-card'),
  3: document.getElementById('decision-3-card'),
};

const technicalHints = [
  document.getElementById('hint-1'),
  document.getElementById('hint-2'),
  document.getElementById('hint-3'),
];

const resultCard = document.getElementById('result-card');
const resultTitle = document.getElementById('result-title');
const resultDescription = document.getElementById('result-description');
const resultSummary = document.getElementById('result-summary');
const restartBtn = document.getElementById('restart-btn');

const tutorForm = document.getElementById('tutor-form');
const tutorInput = document.getElementById('tutor-input');
const chatMessages = document.getElementById('chat-messages');

/**
 * 60 Saniyelik Geri Sayım Sayacı ("Deneyimliyim" seçildiğinde aktif olur)
 */
function startCountdownTimer() {
  stopCountdownTimer();
  gameState.remainingSeconds = 60;
  countdownValue.textContent = String(gameState.remainingSeconds);
  timerBadge.classList.remove('hidden');

  gameState.timerInterval = setInterval(() => {
    if (gameState.remainingSeconds > 0) {
      gameState.remainingSeconds -= 1;
      countdownValue.textContent = String(gameState.remainingSeconds);
    } else {
      stopCountdownTimer();
    }
  }, 1000);
}

function stopCountdownTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

/**
 * Simülasyonu Başlatma
 */
function startSimulation() {
  gameState.started = true;
  gameState.level = levelSelect.value;
  gameState.role = roleSelect.value;
  gameState.goal = goalSelect.value;

  // Profil özetini güncelle ve göster
  summaryLevel.textContent = gameState.level === 'Yeni' ? 'Yeni başladım' : 'Deneyimliyim';
  summaryRole.textContent = gameState.role;
  summaryGoal.textContent = gameState.goal;
  profileSummaryBar.classList.remove('hidden');

  // Seviye kurallarını uygula:
  // - "Yeni başladım" -> teknik ipuçları açık
  // - "Deneyimliyim" -> 60 saniyelik geri sayım sayacı başlasın
  if (gameState.level === 'Yeni') {
    hintModeBadge.classList.remove('hidden');
    timerBadge.classList.add('hidden');
    stopCountdownTimer();
    technicalHints.forEach((hintEl) => hintEl.classList.remove('hidden'));
  } else {
    hintModeBadge.classList.add('hidden');
    technicalHints.forEach((hintEl) => hintEl.classList.add('hidden'));
    startCountdownTimer();
  }

  // Karar 1 alanını görünür yap
  decisionsContainer.classList.remove('hidden');
  decisionCards[1].classList.remove('hidden');
}

/**
 * Karar Seçimi İşleyicisi (Karar 1, 2 ve 3)
 */
function handleDecisionChoice(decisionNum, choice) {
  // Eğer kullanıcı doğrudan karar butonuna tıkladıysa simülasyon başlatılmış sayılır
  if (!gameState.started) {
    startSimulation();
  }

  gameState.choices[decisionNum] = choice;

  // Butonların görsel seçili durumunu güncelle
  const btnA = document.getElementById(`d${decisionNum}-option-a`);
  const btnB = document.getElementById(`d${decisionNum}-option-b`);
  btnA.classList.remove('selected-a', 'selected-b');
  btnB.classList.remove('selected-a', 'selected-b');

  if (choice === 'A') {
    btnA.classList.add('selected-a');
  } else {
    btnB.classList.add('selected-b');
  }

  // "Ne oldu?" ve "Neden oldu?" teknik açıklamasını göster
  const feedbackBox = document.getElementById(`feedback-${decisionNum}`);
  const whatEl = document.getElementById(`feedback-${decisionNum}-what`);
  const whyEl = document.getElementById(`feedback-${decisionNum}-why`);

  const explanation = DECISION_EXPLANATIONS[decisionNum][choice];
  whatEl.textContent = explanation.what;
  whyEl.textContent = explanation.why;
  feedbackBox.classList.remove('hidden');

  // Sonraki adıma geçiş veya sonuç ekranı gösterimi
  if (decisionNum === 1) {
    gameState.currentStep = 2;
    crisisClock.textContent = '08:12';
    decisionCards[2].classList.remove('hidden');
  } else if (decisionNum === 2) {
    gameState.currentStep = 3;
    crisisClock.textContent = '08:20';
    decisionCards[3].classList.remove('hidden');
  } else if (decisionNum === 3) {
    crisisClock.textContent = '08:25';
    stopCountdownTimer();
    renderOutcome(choice);
  }
}

/**
 * Sonuç Ekranı ("Son A" veya "Son B")
 */
function renderOutcome(decision3Choice) {
  resultCard.classList.remove('hidden', 'good-ending', 'bad-ending');

  if (decision3Choice === 'A') {
    resultCard.classList.add('good-ending');
    resultTitle.textContent = 'Son A · İYİ: 08:25 sistem ayakta, veri güvende';
    resultDescription.textContent =
      'Tebrikler! Saat 08:25 itibarıyla randevu sistemi tekrar ayakta, bekleyen 300 hastanın işlemleri güvenle alınıyor ve loglardaki kişisel veriler maskelendiği için KVKK uyumluluğu tam olarak korundu.';
  } else {
    resultCard.classList.add('bad-ending');
    resultTitle.textContent = 'Son B · KÖTÜ: Sistem ayakta ama KVKK ihlali';
    resultDescription.textContent =
      'Uyarı! Randevu sistemi yeniden ayağa kalktı ancak hata loglarındaki açık hasta adı ve T.C. kimlik verileri maskelenmeden paylaşıldığı için ciddi bir KVKK veri ihlali gerçekleşti.';
  }

  resultSummary.innerHTML = `
    <strong>Kriz Karar Özeti:</strong><br/>
    • Profil: ${gameState.level === 'Yeni' ? 'Yeni başladım' : 'Deneyimliyim'} | ${gameState.role} | Hedef: ${gameState.goal}<br/>
    • Karar 1 (Mimari): ${gameState.choices[1] === 'A' ? 'A) Eski sürüme geri dön' : 'B) Canlıda yama yap'}<br/>
    • Karar 2 (Test): ${gameState.choices[2] === 'A' ? 'A) Önce kısa test koş' : 'B) Hemen yayına al'}<br/>
    • Karar 3 (KVKK): ${gameState.choices[3] === 'A' ? 'A) Maskele' : 'B) Ekibe olduğu gibi at'}
  `;
}

/**
 * Simülasyonu Sıfırlama
 */
function resetSimulation() {
  stopCountdownTimer();
  gameState.started = false;
  gameState.currentStep = 1;
  gameState.choices = { 1: null, 2: null, 3: null };
  crisisClock.textContent = '08:00';

  decisionCards[2].classList.add('hidden');
  decisionCards[3].classList.add('hidden');
  resultCard.classList.add('hidden');

  [1, 2, 3].forEach((num) => {
    document.getElementById(`feedback-${num}`).classList.add('hidden');
    document.getElementById(`d${num}-option-a`).classList.remove('selected-a', 'selected-b');
    document.getElementById(`d${num}-option-b`).classList.remove('selected-a', 'selected-b');
  });

  startSimulation();
}

/**
 * Sokratik AI Tutor — Cevap Sızdırmaz (No-Leak) Yanıt Üretici
 * Kullanıcı doğrudan "Hangisini seçeyim?" veya şık istediğinde kesinlikle doğru şıkkı vermez;
 * Sokratik yönlendirici soru sorar.
 */
function generateSocraticResponse(userQuestion) {
  const q = userQuestion.toLowerCase();

  // KVKK / Log / Hasta adı soruları
  if (q.includes('kvkk') || q.includes('log') || q.includes('hasta') || q.includes('maske')) {
    return 'Doğrudan bir şık söyleyemem; ancak şu soruyu birlikte düşünelim: Bir sunucu hatasını (timeout) çözmek için hastanın gerçek adına ve kimlik numarasına gerçekten ihtiyacımız var mı, yoksa bu kişisel verileri açık paylaşmak nasıl bir hukuki sorumluluk doğurur?';
  }

  // Test / Yayın / Smoke test soruları
  if (q.includes('test') || q.includes('yayın') || q.includes('smoke')) {
    return 'Sana doğrudan hangi seçeneğe tıklayacağını söyleyemem ama şunu tartalım: 3 dakikalık kısa bir doğrulama testi yapmak mı daha çok zaman kaybettirir, yoksa doğrulanmamış bir paketi canlıya alıp sistemi ikinci kez çökertme riski mi?';
  }

  // Mimari / Rollback / Yama soruları
  if (q.includes('eski sürüm') || q.includes('rollback') || q.includes('yama') || q.includes('mimari') || q.includes('canlıda')) {
    return 'Kararı senin vermen gerekiyor; fakat bir mühendis olarak şunu sorgula: 300 hasta beklerken daha önce çalıştığı kanıtlanmış bir sürüme dönmek mi, yoksa stres altında canlı ortamda yeni kod yazmak mı sistemi daha öngörülebilir şekilde kurtarır?';
  }

  // Doğrudan cevap / şık isteme ("Hangisini seçeyim?", "A mı B mi?", "Cevap ne?")
  if (
    q.includes('hangisi') ||
    q.includes('seçeyim') ||
    q.includes('doğru') ||
    q.includes('cevap') ||
    q.includes('şık')
  ) {
    if (gameState.currentStep === 1) {
      return 'Kural gereği doğrudan doğru şıkkı veremem! Ancak Karar 1 (Mimari) için şunu düşün: Kriz anında sistem kararlılığını en hızlı geri kazanmak için bilinen çalışan sürüme dönmenin ve canlıda kod değiştirmenin riskleri nelerdir?';
    }
    if (gameState.currentStep === 2) {
      return 'Doğrudan şık paylaşamam; ama Karar 2 (Test) aşamasında kendine şu soruyu sorabilirsin: Hız baskısı altında bile temel fonksiyonları doğrulamadan canlıya çıkmak krizi çözer mi, yoksa yeni bir arıza riski mi yaratır?';
    }
    return 'Doğrudan doğru şıkkı söyleyemem! Karar 3 (KVKK) için şunu değerlendir: Ekibin hatayı çözmesi için logdaki kişisel hasta verilerinin açık görünmesi şart mı, yoksa veri gizliliği ilkesi burada neyi gerektirir?';
  }

  // Genel Sokratik yanıt
  return `Sokratik rehber olarak doğrudan şık veremem; ancak ${gameState.role} rolünde ve "${gameState.goal}" hedefin doğrultusunda şunu düşünelim: Bu adımda alacağın kararın sistem kararlılığı, test güvencesi ve hasta verisi mahremiyeti üzerindeki uzun vadeli etkisi ne olur?`;
}

function appendChatMessage(sender, text, isTutor = false) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isTutor ? 'tutor-bubble' : 'user-bubble'}`;
  bubble.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Olay Dinleyicileri (Event Listeners)
startGameBtn.addEventListener('click', () => {
  startSimulation();
});

// Seviye değiştiğinde oyun aktifse anında ipucu/sayaç modunu güncelle
levelSelect.addEventListener('change', () => {
  if (gameState.started) {
    startSimulation();
  }
});

document.querySelectorAll('.option-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const decisionNum = Number(btn.getAttribute('data-decision'));
    const choice = btn.getAttribute('data-choice');
    handleDecisionChoice(decisionNum, choice);
  });
});

restartBtn.addEventListener('click', () => {
  resetSimulation();
});

tutorForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = tutorInput.value.trim();
  if (!question) return;

  appendChatMessage('Öğrenci', question, false);
  const socraticReply = generateSocraticResponse(question);
  appendChatMessage('AI Tutor', socraticReply, true);
  tutorInput.value = '';
});

document.querySelectorAll('.chip-btn').forEach((chip) => {
  chip.addEventListener('click', () => {
    const promptText = chip.getAttribute('data-prompt');
    tutorInput.value = promptText;
    tutorForm.dispatchEvent(new Event('submit'));
  });
});
