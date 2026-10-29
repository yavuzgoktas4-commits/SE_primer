const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
    video: true,
    defaultCommandTimeout: 6000,
    pageLoadTimeout: 15000,
  },
});
