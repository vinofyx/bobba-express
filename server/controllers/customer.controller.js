const Customer = require('../models/customer.model');

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { type, name, companyName, gst, phone, email, address } = req.body;

    if (!name)    return res.status(400).json({ success: false, message: 'name is required.' });
    if (!phone)   return res.status(400).json({ success: false, message: 'phone is required.' });
    if (!address) return res.status(400).json({ success: false, message: 'address is required.' });
    if (type === 'B2B' && !companyName)
      return res.status(400).json({ success: false, message: 'companyName is required for B2B customers.' });

    const customer = await Customer.create({
      type: type || 'B2C', name, companyName, gst, phone, email, address,
      createdBy: req.user?._id,
    });

    return res.status(201).json({ success: true, data: { customer } });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
    return res.status(500).json({ success: false, message: err.message });
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
