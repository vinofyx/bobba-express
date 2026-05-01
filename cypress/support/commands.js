// Custom Cypress Commands for BobbaExpress

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', '/api/auth/login', {
    email: email,
    password: password
  }).then((resp) => {
    window.localStorage.setItem('token', resp.body.token)
  })
})

// Login as specific users
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@bobba.com', 'Admin@1234')
})

Cypress.Commands.add('loginAsAgent', () => {
  cy.login('agent@bobba.com', 'Agent@1234')
})

Cypress.Commands.add('loginAsCustomer', () => {
  cy.login('customer@bobba.com', 'Customer@1234')
})

// Create customer command
Cypress.Commands.add('createCustomer', (customerData) => {
  cy.loginAsAdmin()
  cy.visit('/customers')
  cy.get('[data-testid="btn-add-customer"]').click()
  
  if (customerData.fullName) cy.get('[name="fullName"]').type(customerData.fullName)
  if (customerData.email) cy.get('[name="email"]').type(customerData.email)
  if (customerData.phone) cy.get('[name="phone"]').type(customerData.phone)
  if (customerData.address) {
    cy.get('[name="address.line1"]').type(customerData.address.line1 || '')
    cy.get('[name="address.city"]').type(customerData.address.city || '')
    cy.get('[name="address.state"]').type(customerData.address.state || '')
    cy.get('[name="address.postalCode"]').type(customerData.address.postalCode || '')
  }
  
  cy.get('[data-testid="btn-save-customer"]').click()
  cy.get('[data-testid="success-message"]').should('be.visible')
})

// Create pickup command
Cypress.Commands.add('createPickup', (pickupData) => {
  cy.loginAsAdmin()
  cy.visit('/pickups')
  cy.get('[data-testid="btn-schedule-pickup"]').click()
  
  if (pickupData.customerName) {
    cy.get('[data-testid="customer-search"]').type(pickupData.customerName)
    cy.get('[data-testid="customer-option-0"]').click()
  }
  
  if (pickupData.scheduledDate) cy.get('[name="scheduledDate"]').type(pickupData.scheduledDate)
  if (pickupData.pickupTime) cy.get('[name="pickupTime"]').type(pickupData.pickupTime)
  if (pickupData.parcelCount) cy.get('[name="parcelCount"]').type(pickupData.parcelCount)
  
  cy.get('[data-testid="btn-confirm-pickup"]').click()
  cy.get('[data-testid="success-message"]').should('be.visible')
})

// Track parcel command
Cypress.Commands.add('trackParcel', (trackingId) => {
  cy.visit('/tracking')
  cy.get('[data-testid="tracking-input"]').type(trackingId)
  cy.get('[data-testid="btn-track"]').click()
  cy.get('[data-testid="tracking-results"]').should('be.visible')
})

// Complete shipment delivery command
Cypress.Commands.add('completeShipmentDelivery', (deliveryData) => {
  cy.loginAsAdmin()
  cy.visit('/shipments')
  
  // Find first in-transit shipment
  cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
    .first()
    .find('[data-testid="btn-mark-delivered"]')
    .click()
  
  // Fill delivery form
  if (deliveryData.photoProof) {
    cy.get('[data-testid="photo-proof-input"]').selectFile(deliveryData.photoProof)
  }
  if (deliveryData.recipientName) {
    cy.get('[data-testid="recipient-name-input"]').type(deliveryData.recipientName)
  }
  if (deliveryData.note) {
    cy.get('[data-testid="delivery-notes"]').type(deliveryData.note)
  }
  
  // Add signature if provided
  if (deliveryData.signature) {
    cy.get('[data-testid="signature-canvas"]').then(($canvas) => {
      if ($canvas.is(':visible')) {
        cy.wrap($canvas).click(10, 10)
          .trigger('mousedown', 10, 10)
          .trigger('mousemove', 50, 50)
          .trigger('mouseup', 50, 50)
      }
    })
  }
  
  cy.get('[data-testid="btn-complete-delivery"]').click()
  cy.get('[data-testid="success-message"]').should('be.visible')
})

// Verify success message command
Cypress.Commands.add('verifySuccess', (message) => {
  cy.get('[data-testid="success-message"]').should('be.visible')
  cy.get('[data-testid="success-message"]').should('contain', message)
})

// Verify error message command
Cypress.Commands.add('verifyError', (message) => {
  cy.get('[data-testid="error-message"]').should('be.visible')
  cy.get('[data-testid="error-message"]').should('contain', message)
})

// Wait for API response command
Cypress.Commands.add('waitForApi', (endpoint) => {
  cy.intercept('GET', endpoint).as('apiCall')
  cy.wait('@apiCall')
})

// Fill form command
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[name="${field}"]`).type(value)
  })
})

// Select dropdown command
Cypress.Commands.add('selectOption', (selector, option) => {
  cy.get(selector).select(option)
})

// Upload file command
Cypress.Commands.add('uploadFile', (selector, filePath) => {
  cy.get(selector).selectFile(filePath)
})

// Verify element exists and is visible
Cypress.Commands.add('shouldBeVisible', (selector) => {
  cy.get(selector).should('be.visible')
})

// Verify element contains text
Cypress.Commands.add('shouldContainText', (selector, text) => {
  cy.get(selector).should('contain', text)
})

// Verify element has attribute
Cypress.Commands.add('shouldHaveAttribute', (selector, attribute, value) => {
  cy.get(selector).should('have.attr', attribute, value)
})

// Verify element has class
Cypress.Commands.add('shouldHaveClass', (selector, className) => {
  cy.get(selector).should('have.class', className)
})

// Wait for element to be visible
Cypress.Commands.add('waitForVisible', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

// Click element when visible
Cypress.Commands.add('clickWhenVisible', (selector) => {
  cy.get(selector).should('be.visible').click()
})

// Type text when element is visible
Cypress.Commands.add('typeWhenVisible', (selector, text) => {
  cy.get(selector).should('be.visible').type(text)
})

// Clear and type
Cypress.Commands.add('clearAndType', (selector, text) => {
  cy.get(selector).clear().type(text)
})

// Verify URL contains path
Cypress.Commands.add('verifyUrl', (path) => {
  cy.url().should('include', path)
})

// Navigate to page
Cypress.Commands.add('navigateTo', (path) => {
  cy.visit(path)
})

// Reload page
Cypress.Commands.add('reloadPage', () => {
  cy.reload()
})

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
})

// Get element text
Cypress.Commands.add('getElementText', (selector) => {
  return cy.get(selector).invoke('text')
})

// Get element attribute
Cypress.Commands.add('getElementAttribute', (selector, attribute) => {
  return cy.get(selector).invoke('attr', attribute)
})

// Check if element exists
Cypress.Commands.add('elementExists', (selector) => {
  cy.get(selector).should('exist')
})

// Check if element does not exist
Cypress.Commands.add('elementNotExists', (selector) => {
  cy.get(selector).should('not.exist')
})

// Wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]').should('not.exist')
})

// Take screenshot
Cypress.Commands.add('takeScreenshot', (name) => {
  cy.screenshot(name)
})

// Log message
Cypress.Commands.add('logMessage', (message) => {
  cy.log(message)
})
