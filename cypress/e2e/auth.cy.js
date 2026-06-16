/**
 * @file auth.cy.js
 * @description Cypress E2E tests for the complete authentication flow.
 *              Tests: signup, login, logout, protected route redirect, persistence.
 */

const BASE_URL = Cypress.config('baseUrl') || 'http://localhost:5173';
const TEST_EMAIL = `cypress_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Cypress123!';
const TEST_NAME = 'Cypress Tester';

describe('Authentication Flow', () => {

  // ─── Signup ────────────────────────────────────────────────────────────
  describe('Signup Page', () => {
    beforeEach(() => {
      cy.visit('/signup');
    });

    it('renders signup form', () => {
      cy.get('[data-cy="signup-form"]').should('be.visible');
      cy.get('[data-cy="name-input"]').should('exist');
      cy.get('[data-cy="email-input"]').should('exist');
      cy.get('[data-cy="password-input"]').should('exist');
      cy.get('[data-cy="signup-btn"]').should('exist');
    });

    it('shows validation error on empty submit', () => {
      cy.get('[data-cy="signup-btn"]').click();
      cy.get('[data-cy="error-message"]').should('be.visible');
    });

    it('shows error for short password', () => {
      cy.get('[data-cy="name-input"]').type('Test');
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('123');
      cy.get('[data-cy="signup-btn"]').click();
      cy.get('[data-cy="error-message"]').should('be.visible');
    });

    it('registers new user and redirects to dashboard', () => {
      cy.get('[data-cy="name-input"]').type(TEST_NAME);
      cy.get('[data-cy="email-input"]').type(TEST_EMAIL);
      cy.get('[data-cy="password-input"]').type(TEST_PASSWORD);
      cy.get('[data-cy="signup-btn"]').click();

      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="dashboard-title"]').should('be.visible');
    });
  });

  // ─── Login ─────────────────────────────────────────────────────────────
  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('renders login form', () => {
      cy.get('[data-cy="login-form"]').should('be.visible');
      cy.get('[data-cy="email-input"]').should('exist');
      cy.get('[data-cy="password-input"]').should('exist');
      cy.get('[data-cy="login-btn"]').should('exist');
    });

    it('shows error for wrong credentials', () => {
      cy.get('[data-cy="email-input"]').type('wrong@example.com');
      cy.get('[data-cy="password-input"]').type('wrongpassword');
      cy.get('[data-cy="login-btn"]').click();
      cy.get('[data-cy="error-message"]').should('be.visible');
    });

    it('logs in existing user and redirects to dashboard', () => {
      cy.get('[data-cy="email-input"]').type(TEST_EMAIL);
      cy.get('[data-cy="password-input"]').type(TEST_PASSWORD);
      cy.get('[data-cy="login-btn"]').click();

      cy.url().should('include', '/dashboard');
    });

    it('persists login on page refresh', () => {
      cy.get('[data-cy="email-input"]').type(TEST_EMAIL);
      cy.get('[data-cy="password-input"]').type(TEST_PASSWORD);
      cy.get('[data-cy="login-btn"]').click();
      cy.url().should('include', '/dashboard');

      cy.reload();
      cy.url().should('include', '/dashboard');
    });
  });

  // ─── Protected Routes ──────────────────────────────────────────────────
  describe('Protected Routes', () => {
    it('redirects unauthenticated user from /dashboard to /login', () => {
      cy.clearLocalStorage();
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('redirects unauthenticated user from /portfolio to /login', () => {
      cy.clearLocalStorage();
      cy.visit('/portfolio');
      cy.url().should('include', '/login');
    });

    it('allows authenticated user to access dashboard', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-cy="email-input"]').type(TEST_EMAIL);
      cy.get('[data-cy="password-input"]').type(TEST_PASSWORD);
      cy.get('[data-cy="login-btn"]').click();
      cy.url().should('include', '/dashboard');

      // Navigate to portfolio
      cy.visit('/portfolio');
      cy.url().should('include', '/portfolio');
    });
  });

  // ─── Logout ────────────────────────────────────────────────────────────
  describe('Logout', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('[data-cy="email-input"]').type(TEST_EMAIL);
      cy.get('[data-cy="password-input"]').type(TEST_PASSWORD);
      cy.get('[data-cy="login-btn"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('logs out and redirects to login', () => {
      cy.get('[data-cy="logout-btn"]').click();
      cy.url().should('include', '/login');
    });

    it('clears auth token on logout', () => {
      cy.get('[data-cy="logout-btn"]').click();
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null;
      });
    });
  });
});
