describe('Bobba Express Full Flow', () => {

  beforeEach(() => {
    // Login via API (faster than UI login each time)
    cy.request('POST', '/api/auth/login', {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }).then((resp) => {
      window.localStorage.setItem('token', resp.body.token)
    })
  })

  it('creates customer → pickup → shipment → tracks', () => {

    // CREATE CUSTOMER
    cy.visit('/customers')
    cy.get('[data-testid="btn-add-customer"]').click()
    cy.get('[name="fullName"]').type('Ahmad Zulkifli')
    cy.get('[name="email"]').type('ahmad@test.com')
    cy.get('[name="phone"]').type('0123456789')
    cy.get('[data-testid="btn-save-customer"]').click()
    cy.contains('Customer created').should('be.visible')

    // CREATE PICKUP
    cy.visit('/pickups')
    cy.get('[data-testid="btn-schedule-pickup"]').click()
    cy.get('[data-testid="customer-search"]').type('Ahmad')
    cy.get('[data-testid="customer-option-0"]').click()
    cy.get('[name="pickupDate"]').type('2025-04-29')
    cy.get('[name="pickupTime"]').type('10:00')
    cy.get('[data-testid="btn-confirm-pickup"]').click()
    cy.contains('Pickup scheduled').should('be.visible')

    // TRACK PARCEL
    cy.visit('/tracking')
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    cy.get('[data-testid="step-transit"]')
      .should('have.attr', 'data-status', 'active')
  })
})
