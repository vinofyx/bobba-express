const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomerById } = require('../controllers/customer.controller');

// POST /api/customers - Create new customer
router.post('/', createCustomer);

// GET /api/customers - Get all customers
router.get('/', getCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', getCustomerById);

module.exports = router;
