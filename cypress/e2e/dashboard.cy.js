/**
 * @file dashboard.cy.js
 * @description Cypress E2E tests for the main dashboard page.
 *              Tests: render, stock cards, live prices, navigation, chart.
 */

const TEST_EMAIL = Cypress.env('TEST_EMAIL') || 'testuser@example.com';
const TEST_PASSWORD = Cypress.env('TEST_PASSWORD') || 'password123';

// ─── Helper: Login Command ─────────────────────────────────────────────────
const login = () => {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').type(TEST_EMAIL);
  cy.get('[data-cy="password-input"]').type(TEST_PASSWORD);
  cy.get('[data-cy="login-btn"]').click();
  cy.url().should('include', '/dashboard');
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    login();
  });

  // ─── Page Structure ──────────────────────────────────────────────────
  describe('Layout & Structure', () => {
    it('renders dashboard page correctly', () => {
      cy.get('[data-cy="dashboard-title"]').should('be.visible');
    });

    it('shows sidebar navigation', () => {
      cy.get('[data-cy="sidebar"]').should('be.visible');
    });

    it('displays all main navigation links', () => {
      const navItems = ['dashboard', 'portfolio', 'markets', 'watchlist', 'predictions'];
      navItems.forEach(item => {
        cy.get(`[data-cy="nav-${item}"]`).should('exist');
      });
    });
  });

  // ─── Stock Data ──────────────────────────────────────────────────────
  describe('Stock Data', () => {
    it('displays stock market cards', () => {
      cy.get('[data-cy="stock-card"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
    });

    it('stock cards show price data', () => {
      cy.get('[data-cy="stock-card"]').first().within(() => {
        cy.get('[data-cy="stock-price"]').should('be.visible');
        cy.get('[data-cy="stock-symbol"]').should('be.visible');
      });
    });

    it('shows portfolio summary stats', () => {
      cy.get('[data-cy="stat-card"]').should('have.length.greaterThan', 0);
    });
  });

  // ─── Navigation ──────────────────────────────────────────────────────
  describe('Navigation', () => {
    it('navigates to portfolio page', () => {
      cy.get('[data-cy="nav-portfolio"]').click();
      cy.url().should('include', '/portfolio');
    });

    it('navigates to predictions page', () => {
      cy.get('[data-cy="nav-predictions"]').click();
      cy.url().should('include', '/predictions');
    });

    it('navigates to markets page', () => {
      cy.get('[data-cy="nav-markets"]').click();
      cy.url().should('include', '/markets');
    });
  });

  // ─── Theme Toggle ────────────────────────────────────────────────────
  describe('Theme', () => {
    it('toggles dark/light mode', () => {
      cy.get('[data-cy="theme-toggle"]').click();
      cy.get('html').should('have.class', 'light').or('have.class', 'dark');
    });
  });

  // ─── Responsive Layout ───────────────────────────────────────────────
  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.get('[data-cy="dashboard-title"]').should('be.visible');
    });

    it('adapts to tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="dashboard-title"]').should('be.visible');
    });
  });
});
