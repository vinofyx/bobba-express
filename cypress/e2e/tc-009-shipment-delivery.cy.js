describe('TC-009: Shipment Delivery Completion', () => {

  beforeEach(() => {
    // Login as admin
    cy.request('POST', '/api/auth/login', {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }).then((resp) => {
      window.localStorage.setItem('token', resp.body.token)
    })
  })

  it('should complete shipment delivery workflow', () => {
    // Navigate to shipments
    cy.visit('/shipments')
    
    // Find shipment with "In Transit" status
    cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
      .first()
      .as('inTransitShipment')
    
    // Get shipment ID for verification
    cy.get('@inTransitShipment')
      .find('[data-testid="shipment-id"]')
      .invoke('text')
      .as('shipmentId')
    
    // Click "Mark Delivered" button
    cy.get('@inTransitShipment')
      .find('[data-testid="btn-mark-delivered"]')
      .click()
    
    // Verify delivery modal opens
    cy.get('[data-testid="delivery-modal"]').should('be.visible')
    cy.get('[data-testid="delivery-modal"] h2').should('contain', 'Complete Delivery')
    
    // Fill delivery form
    cy.get('[data-testid="photo-proof-input"]').selectFile('cypress/fixtures/delivery-proof.jpg')
    cy.get('[data-testid="recipient-name-input"]').type('Siti Aminah')
    
    // Add signature (if signature pad is present)
    cy.get('[data-testid="signature-canvas"]').then(($canvas) => {
      if ($canvas.is(':visible')) {
        // Simulate signature drawing
        cy.wrap($canvas)
          .click(10, 10)
          .trigger('mousedown', 10, 10)
          .trigger('mousemove', 50, 50)
          .trigger('mouseup', 50, 50)
      }
    })
    
    // Add delivery notes
    cy.get('[data-testid="delivery-notes"]').type('Delivered to recipient at office entrance')
    
    // Submit delivery form
    cy.get('[data-testid="btn-complete-delivery"]').click()
    
    // Wait for success message
    cy.get('[data-testid="success-message"]').should('be.visible')
    cy.get('[data-testid="success-message"]').should('contain', 'Delivery completed successfully')
    
    // Verify shipment status updated to "Completed"
    cy.reload()
    cy.get('@shipmentId').then((shipmentId) => {
      cy.get(`[data-testid="shipment-item"]:contains("${shipmentId}")`)
        .find('[data-testid="status"]')
        .should('contain', 'Completed')
    })
    
    // Verify delivery timestamp is displayed
    cy.get(`[data-testid="shipment-item"]:contains("${shipmentId}")`)
      .find('[data-testid="delivery-timestamp"]')
      .should('be.visible')
  })

  it('should validate delivery form - missing photo proof', () => {
    cy.visit('/shipments')
    
    cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
      .first()
      .find('[data-testid="btn-mark-delivered"]')
      .click()
    
    // Try to submit without photo proof
    cy.get('[data-testid="recipient-name-input"]').type('Siti Aminah')
    cy.get('[data-testid="btn-complete-delivery"]').click()
    
    // Verify validation error
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Photo proof is required')
  })

  it('should validate delivery form - missing recipient name', () => {
    cy.visit('/shipments')
    
    cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
      .first()
      .find('[data-testid="btn-mark-delivered"]')
      .click()
    
    // Try to submit without recipient name
    cy.get('[data-testid="photo-proof-input"]').selectFile('cypress/fixtures/delivery-proof.jpg')
    cy.get('[data-testid="btn-complete-delivery"]').click()
    
    // Verify validation error
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Recipient name is required')
  })

  it('should verify all parcels marked as delivered', () => {
    cy.visit('/shipments')
    
    cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
      .first()
      .as('inTransitShipment')
    
    // Get initial parcel count
    cy.get('@inTransitShipment')
      .find('[data-testid="parcel-count"]')
      .invoke('text')
      .as('parcelCount')
    
    // Get shipment ID
    cy.get('@inTransitShipment')
      .find('[data-testid="shipment-id"]')
      .invoke('text')
      .as('shipmentId')
    
    // Complete delivery
    cy.get('@inTransitShipment')
      .find('[data-testid="btn-mark-delivered"]')
      .click()
    
    cy.get('[data-testid="photo-proof-input"]').selectFile('cypress/fixtures/delivery-proof.jpg')
    cy.get('[data-testid="recipient-name-input"]').type('Siti Aminah')
    cy.get('[data-testid="btn-complete-delivery"]').click()
    
    // Wait for success
    cy.get('[data-testid="success-message"]').should('be.visible')
    
    // Navigate to parcels page to verify all parcels are delivered
    cy.visit('/parcels')
    
    // Filter parcels by shipment
    cy.get('@shipmentId').then((shipmentId) => {
      cy.get('[data-testid="shipment-filter"]').select(shipmentId)
    })
    
    // Verify all parcels show "Delivered" status
    cy.get('@parcelCount').then((parcelCount) => {
      const expectedCount = parseInt(parcelCount.match(/\d+/)[0])
      cy.get('[data-testid="parcel-item"]:has([data-testid="status"]:contains("Delivered"))')
        .should('have.length', expectedCount)
    })
  })

  it('should verify tracking page shows all steps green', () => {
    // First complete a delivery
    cy.visit('/shipments')
    
    cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
      .first()
      .find('[data-testid="btn-mark-delivered"]')
      .click()
    
    cy.get('[data-testid="photo-proof-input"]').selectFile('cypress/fixtures/delivery-proof.jpg')
    cy.get('[data-testid="recipient-name-input"]').type('Siti Aminah')
    cy.get('[data-testid="btn-complete-delivery"]').click()
    
    cy.get('[data-testid="success-message"]').should('be.visible')
    
    // Get tracking ID from delivered parcels
    cy.visit('/parcels')
    cy.get('[data-testid="parcel-item"]')
      .first()
      .find('[data-testid="tracking-id"]')
      .invoke('text')
      .as('trackingId')
    
    // Navigate to tracking page
    cy.visit('/tracking')
    cy.get('@trackingId').then((trackingId) => {
      cy.get('[data-testid="tracking-input"]').type(trackingId)
      cy.get('[data-testid="btn-track"]').click()
    })
    
    // Verify all timeline steps are completed (green)
    cy.get('[data-testid="timeline-step.completed"]').should('have.length', 5)
    
    // Verify delivery step is completed
    cy.get('[data-testid="timeline-step"]:contains("Delivered")')
      .should('have.class', 'completed')
    
    // Verify delivery date is shown
    cy.get('[data-testid="delivery-date"]').should('be.visible')
  })

  it('should generate invoice after delivery', () => {
    cy.visit('/shipments')
    
    cy.get('[data-testid="shipment-item"]:has([data-testid="status"]:contains("In Transit"))')
      .first()
      .find('[data-testid="btn-mark-delivered"]')
      .click()
    
    // Complete delivery
    cy.get('[data-testid="photo-proof-input"]').selectFile('cypress/fixtures/delivery-proof.jpg')
    cy.get('[data-testid="recipient-name-input"]').type('Siti Aminah')
    cy.get('[data-testid="btn-complete-delivery"]').click()
    
    // Verify invoice is generated and displayed
    cy.get('[data-testid="invoice-modal"]').should('be.visible')
    cy.get('[data-testid="invoice-id"]').should('be.visible')
    cy.get('[data-testid="invoice-id"]').should('contain', 'INV-')
    
    // Verify invoice details
    cy.get('[data-testid="invoice-shipment-id"]').should('be.visible')
    cy.get('[data-testid="invoice-recipient"]').should('contain', 'Siti Aminah')
    cy.get('[data-testid="invoice-parcels"]').should('be.visible')
    cy.get('[data-testid="invoice-total"]').should('be.visible')
    
    // Test invoice download
    cy.get('[data-testid="btn-download-invoice"]').click()
    cy.readFile('cypress/downloads/invoice*.pdf').should('exist')
  })
})
