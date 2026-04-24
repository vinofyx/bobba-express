import React, { useState } from 'react';
import { pickupsAPI } from '../api/pickupApi';

const PickupPage = () => {
  const [form, setForm] = useState({
    customerId: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    pickupDate: '',
    pickupTime: '09:00',
    deliveryType: 'standard',
    parcelType: 'parcel',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Change in payload:
      await pickupsAPI.create({
        customer:      form.customerId,
        pickupAddress: { 
          line1: form.line1, 
          city: form.city, 
          state: form.state, 
          pincode: form.pincode 
        },
        scheduledDate: form.pickupDate,
        pickupTime:    form.pickupTime || '09:00',
        deliveryType:  form.deliveryType || 'standard',
        parcelType:    form.parcelType,
        notes:         form.notes
      });

      setSuccess('Pickup created successfully!');
      setForm({
        customerId: '',
        line1: '',
        city: '',
        state: '',
        pincode: '',
        pickupDate: '',
        pickupTime: '09:00',
        deliveryType: 'standard',
        parcelType: 'parcel',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pickup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pickup-page">
      <h2>Create Pickup Request</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="customerId">Customer ID *</label>
          <input
            type="text"
            id="customerId"
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            required
          />
        </div>

        <fieldset>
          <legend>Pickup Address *</legend>
          
          <div className="form-group">
            <label htmlFor="line1">Address Line 1 *</label>
            <input
              type="text"
              id="line1"
              name="line1"
              value={form.line1}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State *</label>
            <input
              type="text"
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pincode">PIN Code *</label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              required
            />
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="pickupDate">Pickup Date *</label>
          <input
            type="date"
            id="pickupDate"
            name="pickupDate"
            value={form.pickupDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pickupTime">Pickup Time</label>
          <input
            type="time"
            id="pickupTime"
            name="pickupTime"
            value={form.pickupTime}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="deliveryType">Delivery Type</label>
          <select
            id="deliveryType"
            name="deliveryType"
            value={form.deliveryType}
            onChange={handleChange}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="same_day">Same Day</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="parcelType">Parcel Type</label>
          <select
            id="parcelType"
            name="parcelType"
            value={form.parcelType}
            onChange={handleChange}
          >
            <option value="document">Document</option>
            <option value="parcel">Parcel</option>
            <option value="fragile">Fragile</option>
            <option value="electronics">Electronics</option>
            <option value="bulk">Bulk</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Pickup'}
        </button>
      </form>
    </div>
  );
};

export default PickupPage;
