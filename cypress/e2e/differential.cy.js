describe('The Primer v2 — Diferansiyel Test ve Model Paritesi (Oracle vs Web)', () => {
  beforeEach(() => {
    const baseUrl = Cypress.config('baseUrl');
    cy.visit(baseUrl ? '/' : 'index.html');
    // Simülasyonu başlatarak kararlar ve telemetri alanını aktif hale getir
    cy.get('[data-cy="start-game-btn"]').click();
  });

  it('Python Oracle (parite.json) ile Web Çıkarımı Arasındaki Fark < 1e-4 Toleransı Sağlamalıdır', () => {
    // tests/parite.json dosyasından Python referans çıktılarını ve 5 referans girdiyi oku
    cy.readFile('tests/parite.json').then((pariteData) => {
      const tolerance = pariteData.tolerance || 0.0001;
      expect(pariteData.reference_inputs).to.have.length(5);

      // Her bir referans girdi üzerinde diferansiyel testi koştur
      pariteData.reference_inputs.forEach((refItem) => {
        cy.log(`--- [Diferansiyel Test] Referans #${refItem.id}: ${refItem.name} ---`);

        // Web uygulamasındaki model çıkarım fonksiyonunu referans girdi vektörü ile çağır
        cy.window().then(async (win) => {
          expect(win.runModelInference).to.be.a('function');
          await win.runModelInference(refItem.features);
        });

        // Web arayüzündeki data-cy="p" badge'inden olasılığı oku
        cy.get('[data-cy="p"]')
          .should('be.visible')
          .invoke('text')
          .then((webText) => {
            const webP = parseFloat(webText.trim());
            const pythonP = refItem.python_p;
            const diff = Math.abs(webP - pythonP);

            cy.log(`Girdi: [${refItem.features.join(', ')}]`);
            cy.log(`Web p: ${webP.toFixed(8)} | Python p: ${pythonP.toFixed(8)} | Mutlak Fark: ${diff.toExponential(4)}`);

            // Şartname Kriter 7 (AC7): Fark < 1e-4 (0.0001) iddiası
            expect(diff).to.be.lessThan(tolerance);

            // Şartname Kriter 6 (AC6): p >= 0.60 ise Yüksek Risk / Bilişsel Yük uyarısının kontrolü
            if (refItem.predicted_class === 1) {
              cy.get('[data-cy="telemetry-risk-badge"]')
                .should('be.visible')
                .and('contain', 'Yüksek Bilişsel Yük / Kriz Riski');
            }
          });
      });
    });
  });
});
