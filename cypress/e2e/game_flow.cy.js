describe('SE Primer — Kriz Simülasyonu E2E Testleri (YZM301)', () => {
  beforeEach(() => {
    // Yerel web sunucusu (baseUrl tanımlıysa) veya doğrudan index.html üzerinden stabil çalışır
    const baseUrl = Cypress.config('baseUrl');
    cy.visit(baseUrl ? '/' : 'index.html');
  });

  it('Test 1 (Son A Yolu): Onboarding (Yeni Başladım, Backend, Hızlı Çözüm) -> A -> A -> A -> "Son A" ve "sistem ayakta, veri güvende" doğrulaması', () => {
    // 1. Onboarding seçimleri (Yeni Başladım, Backend, Hızlı Çözüm)
    cy.get('[data-cy="level-select"]').select('Yeni Başladım');
    cy.get('[data-cy="role-select"]').select('Backend');
    cy.get('[data-cy="goal-select"]').select('Hızlı Çözüm');

    // 2. Simülasyonu Başlat
    cy.get('[data-cy="start-game-btn"]').click();
    cy.get('[data-cy="technical-hint-1"]').should('be.visible');

    // 3. Karar 1 (A: Eski sürüme geri dön) -> Geri bildirimi doğrula
    cy.get('[data-cy="d1-option-a"]').click();
    cy.get('[data-cy="feedback-1"]')
      .should('be.visible')
      .and('contain', 'Ne oldu?')
      .and('contain', 'Neden oldu?');

    // 4. Karar 2 (A: Önce kısa test koş) -> Geri bildirimi doğrula
    cy.get('[data-cy="d2-option-a"]').click();
    cy.get('[data-cy="feedback-2"]')
      .should('be.visible')
      .and('contain', 'Ne oldu?')
      .and('contain', 'Neden oldu?');

    // 5. Karar 3 (A: Maskele) -> Geri bildirimi ve Son A ekranını doğrula
    cy.get('[data-cy="d3-option-a"]').click();
    cy.get('[data-cy="feedback-3"]')
      .should('be.visible')
      .and('contain', 'Ne oldu?')
      .and('contain', 'Neden oldu?');

    // 6. Ekranda "Son A" ve "sistem ayakta, veri güvende" metinlerinin görünür olduğunu doğrula
    cy.get('[data-cy="result-card"]')
      .should('be.visible')
      .and('contain', 'Son A')
      .and('contain', 'sistem ayakta, veri güvende');
  });

  it('Test 2 (Son B Yolu): Onboarding (Deneyimliyim) -> 60s Sayaç -> B -> B -> B -> "Son B" ve "KVKK ihlali" doğrulaması', () => {
    // 1. Onboarding seçimleri (Deneyimliyim)
    cy.get('[data-cy="level-select"]').select('Deneyimliyim');
    cy.get('[data-cy="role-select"]').select('Fullstack');
    cy.get('[data-cy="goal-select"]').select('Hızlı Çözüm');

    // 2. Simülasyonu Başlat ve 60s geri sayım sayacını doğrula
    cy.get('[data-cy="start-game-btn"]').click();
    cy.get('[data-cy="timer-badge"]').should('be.visible');
    cy.get('[data-cy="countdown-value"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const seconds = Number(text.trim());
        expect(seconds).to.be.within(1, 60);
      });

    // 3. Karar 1 (B: Canlıda yama yap)
    cy.get('[data-cy="d1-option-b"]').click();
    cy.get('[data-cy="feedback-1"]')
      .should('be.visible')
      .and('contain', 'Ne oldu?')
      .and('contain', 'Neden oldu?');

    // 4. Karar 2 (B: Hemen yayına al)
    cy.get('[data-cy="d2-option-b"]').click();
    cy.get('[data-cy="feedback-2"]')
      .should('be.visible')
      .and('contain', 'Ne oldu?')
      .and('contain', 'Neden oldu?');

    // 5. Karar 3 (B: Ekibe olduğu gibi at)
    cy.get('[data-cy="d3-option-b"]').click();
    cy.get('[data-cy="feedback-3"]')
      .should('be.visible')
      .and('contain', 'Ne oldu?')
      .and('contain', 'Neden oldu?');

    // 6. Ekranda "Son B" ve "KVKK ihlali" metinlerinin görünür olduğunu doğrula
    cy.get('[data-cy="result-card"]')
      .should('be.visible')
      .and('contain', 'Son B')
      .and('contain', 'KVKK ihlali');
  });
});
