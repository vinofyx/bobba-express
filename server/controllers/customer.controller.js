const Customer = require('../models/customer.model');

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { type, name, companyName, gst, phone, email, address } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'name, phone, and address are required.' 
      });
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format.' 
      });
    }

    const customer = await Customer.create({
      type: type || 'B2C',
      name,
      companyName,
      gst,
      phone,
      email,
      address,
      createdBy: req.user?.id || null
    });

    return res.status(201).json({ 
      success: true, 
      data: { customer } 
    });
  } catch (error) {
    // Handle duplicate phone error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already exists.' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true })
      .sort({ createdAt: -1 });

    return res.json({ 
      success: true, 
      data: { customers } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found.' 
      });
    }

    return res.json({ 
      success: true, 
      data: { customer } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById
};
