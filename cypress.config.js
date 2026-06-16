const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    env: {
      TEST_EMAIL: 'testuser@example.com',
      TEST_PASSWORD: 'password123',
      API_URL: 'http://localhost:5000',
    },
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
});
