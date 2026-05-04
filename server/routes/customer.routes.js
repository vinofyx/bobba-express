const express = require('express');
const router  = express.Router();
const { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer } = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: All customer routes require auth; delete = admin only
router.post  ('/',    authenticate, createCustomer);
router.get   ('/',    authenticate, getCustomers);
router.get   ('/:id', authenticate, getCustomerById);
router.put   ('/:id', authenticate, updateCustomer);
router.delete('/:id', authenticate, authorize('admin'), deleteCustomer);

module.exports = router;
