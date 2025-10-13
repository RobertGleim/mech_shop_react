// API endpoint constants for the mech shop application
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: 'https://mech-shop-api.onrender.com',
  
  // Auth endpoints
  AUTH: {
    MECHANIC_LOGIN: '/mechanics/login',
    CUSTOMER_LOGIN: '/customers/login',
    REGISTER_MECHANIC: '/mechanics',
    REGISTER_CUSTOMER: '/customers'
  },
  
  // Profile endpoints
  PROFILE: {
    MECHANIC: '/mechanics/profile',
    CUSTOMER: '/customers/profile',
    ADMIN: '/mechanics/profile' // Admin uses mechanic profile endpoint
  },
  
  // Data management endpoints
  ADMIN: {
    MECHANICS: '/mechanics',
    CUSTOMERS: '/customers',
    TICKETS: '/service_ticket'
  },
  
  // Service endpoints
  SERVICE: {
    TICKETS: '/service_ticket',
    TICKET_MECHANICS: '/ticket_mechanics',
    MECHANIC_JOBS: '/mechanics/jobs'
  },
  
  // Inventory endpoints
  INVENTORY: {
    ITEMS: '/inventory',
    SEARCH: '/inventory/search'
  }
}