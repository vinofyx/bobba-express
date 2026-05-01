export const TEST_USERS = {
  admin: {
    email: 'admin@bobba.com',
    password: 'Admin@1234',
    name: 'Admin User'
  },
  agent: {
    email: 'agent@bobba.com',
    password: 'Agent@1234',
    name: 'Agent User'
  },
  customer: {
    email: 'customer@bobba.com',
    password: 'Customer@1234',
    name: 'Customer User'
  }
};

export const TEST_PARCELS = {
  valid: {
    trackingId: 'BE001234',
    weight: 2.5,
    dimensions: {
      length: 20,
      width: 15,
      height: 10
    },
    type: 'package'
  },
  delivered: {
    trackingId: 'BE001235',
    weight: 1.8,
    dimensions: {
      length: 15,
      width: 10,
      height: 8
    },
    type: 'document'
  }
};

export const TEST_PICKUPS = {
  valid: {
    pickupId: 'PU-2025-001',
    customerName: 'John Doe',
    address: {
      line1: '123 Main Street',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      postalCode: '500001'
    },
    scheduledDate: '2025-05-01',
    pickupTime: '10:00 AM',
    parcelCount: 3
  }
};

export const TEST_SHIPMENTS = {
  valid: {
    shipmentId: 'SH-2025-001',
    route: {
      origin: {
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur'
      },
      destination: {
        city: 'Johor Bahru',
        state: 'Johor'
      }
    },
    driver: {
      name: 'Rajan Kumar',
      phone: '01234567890'
    },
    vehicle: {
      number: 'WXY 1234',
      type: 'van'
    },
    departureTime: '2025-05-01T08:00:00.000Z'
  }
};

export const TEST_DELIVERY = {
  valid: {
    photoProof: 'test-files/delivery-proof.jpg',
    recipientName: 'Siti Aminah',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    note: 'Delivered to recipient at office entrance'
  }
};

export const API_ENDPOINTS = {
  login: '/api/auth/login',
  pickups: '/api/pickups',
  parcels: '/api/parcels',
  shipments: '/api/shipments',
  tracking: '/api/tracking'
};

export const URLS = {
  login: '/login',
  dashboard: '/dashboard',
  pickups: '/pickups',
  parcels: '/parcels',
  shipments: '/shipments',
  tracking: '/tracking'
};
