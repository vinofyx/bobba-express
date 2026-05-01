const express = require('express');
const router  = express.Router();
const { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer } = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../src/middleware/validate');
const { createCustomerSchema, updateCustomerSchema } = require('../src/validators/customer.validator');

// Phase 12: All customer routes require auth; delete = admin only
router.post  ('/',    authenticate, validate(createCustomerSchema), createCustomer);
router.get   ('/',    authenticate,                          getCustomers);
router.get   ('/:id', authenticate,                          getCustomerById);
router.put   ('/:id', authenticate, validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', authenticate, authorize('admin'),      deleteCustomer);

module.exports = router;
