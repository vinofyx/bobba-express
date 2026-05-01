// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands or global configurations here

// Global beforeEach for authentication setup
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage()
})

// Global afterEach for cleanup
afterEach(() => {
  // Clean up any test data if needed
  cy.clearLocalStorage()
})

// Custom error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are not critical to the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})
