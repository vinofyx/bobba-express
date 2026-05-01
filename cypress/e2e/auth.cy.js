describe('Authentication', () => {

  it('should login as admin successfully', () => {
    cy.visit('/login')
    
    cy.get('[name="email"]').type('admin@bobba.com')
    cy.get('[name="password"]').type('Admin@1234')
    cy.get('[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('h1').should('contain', 'Dashboard')
  })

  it('should login as agent successfully', () => {
    cy.visit('/login')
    
    cy.get('[name="email"]').type('agent@bobba.com')
    cy.get('[name="password"]').type('Agent@1234')
    cy.get('[type="submit"]').click()
    
    cy.url().should('include', '/agent/dashboard')
    cy.get('h1').should('contain', 'Agent Dashboard')
  })

  it('should login as customer successfully', () => {
    cy.visit('/login')
    
    cy.get('[name="email"]').type('customer@bobba.com')
    cy.get('[name="password"]').type('Customer@1234')
    cy.get('[type="submit"]').click()
    
    cy.url().should('include', '/customer/dashboard')
    cy.get('h1').should('contain', 'Customer Dashboard')
  })

  it('should show error for invalid credentials', () => {
    cy.visit('/login')
    
    cy.get('[name="email"]').type('invalid@example.com')
    cy.get('[name="password"]').type('wrongpassword')
    cy.get('[type="submit"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
  })

  it('should validate required fields', () => {
    cy.visit('/login')
    
    cy.get('[type="submit"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Email is required')
  })

  it('should logout successfully', () => {
    // Login first
    cy.request('POST', '/api/auth/login', {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }).then((resp) => {
      window.localStorage.setItem('token', resp.body.token)
    })
    
    cy.visit('/dashboard')
    
    // Logout
    cy.get('[data-testid="btn-logout"]').click()
    
    // Verify redirected to login page
    cy.url().should('include', '/login')
    cy.get('h1').should('contain', 'Login')
  })
})
