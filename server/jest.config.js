/**
 * @file jest.config.js
 * @description Jest configuration for backend unit and integration tests.
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 30000,
  setupFilesAfterFramework: [],
  verbose: true,
};
