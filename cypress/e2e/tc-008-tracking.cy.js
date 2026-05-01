describe('TC-008: Public Tracking Functionality', () => {

  it('should track parcel with valid ID', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    // Verify tracking results
    cy.get('[data-testid="tracking-results"]').should('be.visible')
    cy.get('[data-testid="timeline"]').should('be.visible')
    
    // Verify timeline steps
    cy.get('[data-testid="timeline-step"]').should('have.length', 5)
    cy.contains('Picked Up').should('be.visible')
    cy.contains('At Warehouse').should('be.visible')
    cy.contains('In Transit').should('be.visible')
    cy.contains('Out for Delivery').should('be.visible')
    cy.contains('Delivered').should('be.visible')
  })

  it('should show error for invalid tracking ID', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('INVALID123')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Parcel not found')
  })

  it('should validate empty tracking ID', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Enter tracking number')
  })

  it('should show sender/receiver info with partial masking', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="sender-info"]').should('be.visible')
    cy.get('[data-testid="receiver-info"]').should('be.visible')
    
    // Verify phone numbers are masked
    cy.get('[data-testid="phone-number"]').each(($el) => {
      cy.wrap($el).should('contain.text', 'XXXX')
    })
  })

  it('should display ETA for in-transit parcels', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="eta-display"]').should('be.visible')
    cy.get('[data-testid="eta-display"]').should('contain', 'Estimated delivery')
  })

  it('should generate shareable link', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="share-link"]').should('be.visible')
    cy.get('[data-testid="share-link"]').should('contain', '/track?id=BE001234')
  })

  it('should download PDF tracking information', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    // Test PDF download
    cy.get('[data-testid="btn-download-pdf"]').click()
    cy.readFile('cypress/downloads/tracking*.pdf').should('exist')
  })

  it('should subscribe to email updates', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="btn-subscribe"]').click()
    
    cy.get('[data-testid="success-message"]').should('be.visible')
    cy.get('[data-testid="success-message"]').should('contain', 'Successfully subscribed')
  })

  it('should show all steps green for delivered parcel', () => {
    cy.visit('/tracking')
    
    // Use delivered parcel tracking ID
    cy.get('[data-testid="tracking-input"]').type('BE001235')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="tracking-results"]').should('be.visible')
    
    // Verify all timeline steps are completed
    cy.get('[data-testid="timeline-step.completed"]').should('have.length', 5)
    
    // Verify delivery date is shown
    cy.get('[data-testid="delivery-date"]').should('be.visible')
    
    // Verify no ETA for delivered parcels
    cy.get('[data-testid="eta-display"]').should('not.exist')
  })

  it('should handle tracking via URL parameter', () => {
    // Test direct tracking link
    cy.visit('/tracking?id=BE001234')
    
    cy.get('[data-testid="tracking-results"]').should('be.visible')
    cy.get('[data-testid="tracking-results"]').should('contain', 'BE001234')
  })

  it('should validate email format for subscription', () => {
    cy.visit('/tracking')
    
    cy.get('[data-testid="tracking-input"]').type('BE001234')
    cy.get('[data-testid="btn-track"]').click()
    
    cy.get('[data-testid="email-input"]').type('invalid-email')
    cy.get('[data-testid="btn-subscribe"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Please enter a valid email address')
  })
})
