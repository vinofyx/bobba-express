const Customer = require('../models/customer.model');

// Generate customer ID
const generateCustomerId = async () => {
  const prefix = 'CUST';
  const count = await Customer.countDocuments();
  const nextId = String(count + 1).padStart(3, '0');
  return `${prefix}-${nextId}`;
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { type, name, companyName, gst, phone, email, address } = req.body;

    // Check for duplicate phone number
    const existingPhone = await Customer.findOne({ phone, isActive: true });
    if (existingPhone) {
      return res.status(409).json({ 
        success: false, 
        message: 'Phone number already exists' 
      });
    }

    // Check for duplicate email (if provided)
    if (email) {
      const existingEmail = await Customer.findOne({ email, isActive: true });
      if (existingEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already exists' 
        });
      }
    }

    // Generate customer ID
    const customerId = await generateCustomerId();

    const customer = await Customer.create({
      customerId,
      type: type || 'B2C', 
      name, 
      companyName, 
      gst, 
      phone, 
      email, 
      address,
      isActive: true,
      createdBy: req.user?._id,
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Customer created successfully',
      data: { customer } 
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const message = field === 'phone'
        ? 'A customer with this phone number already exists.'
        : field === 'email'
        ? 'A customer with this email already exists.'
        : 'Duplicate entry detected.';
      return res.status(409).json({ success: false, message });
    }
    // Mongoose validation error — surface the real field message
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(422).json({ success: false, message: messages.join(' • ') });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to create customer.' });
  }
};

// GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.type)   filter.type = req.query.type;           // B2B | B2C
    if (req.query.search) filter.$text = { $search: req.query.search };

    const customers = await Customer.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { customers, total: customers.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'name');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    return res.json({ success: true, data: { customer } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { type, name, companyName, gst, phone, email, address } = req.body;

    if (type === 'B2B' && !companyName)
      return res.status(400).json({ success: false, message: 'companyName is required for B2B customers.' });

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { type, name, companyName, gst: gst || undefined, phone, email, address },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    return res.json({ success: true, data: { customer } });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/customers/:id  (soft delete)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    return res.json({ success: true, message: 'Customer deactivated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer };
