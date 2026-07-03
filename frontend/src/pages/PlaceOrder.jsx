import React, { useState } from 'react';
import { orderAPI } from '../services/api';
import '../styles/order-form.css';

function PlaceOrder({ user, onBack }) {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropAddress: '',
    pickupCoordinates: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
    dropCoordinates: { lat: 28.6139, lng: 77.2090 },
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'Prepaid'
  });

  const [chargeData, setChargeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoordinateChange = (type, coord, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [coord]: parseFloat(value)
      }
    }));
  };

  const handleCalculateCharge = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await orderAPI.calculateCharge({
        length: parseFloat(formData.length),
        breadth: parseFloat(formData.breadth),
        height: parseFloat(formData.height),
        actualWeight: parseFloat(formData.actualWeight),
        orderType: formData.orderType,
        paymentType: formData.paymentType,
        pickupCoordinates: formData.pickupCoordinates,
        dropCoordinates: formData.dropCoordinates
      });

      setChargeData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate charge');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!chargeData) {
      setError('Please calculate charge first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await orderAPI.createOrder(formData);
      setSuccess('Order placed successfully!');
      
      // Reset form
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-page">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>📦 Place New Order</h1>
          <button onClick={onBack} className="back-btn">← Back</button>
        </div>
      </nav>

      <div className="order-container">
        <div className="form-column">
          <form className="order-form">
            <h2>Order Details</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <fieldset>
              <legend>Pickup Location</legend>
              <div className="form-group">
                <label>Pickup Address</label>
                <input
                  type="text"
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  placeholder="Enter pickup address"
                  required
                />
              </div>
              <div className="coords-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.pickupCoordinates.lat}
                    onChange={(e) => handleCoordinateChange('pickupCoordinates', 'lat', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.pickupCoordinates.lng}
                    onChange={(e) => handleCoordinateChange('pickupCoordinates', 'lng', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Drop Location</legend>
              <div className="form-group">
                <label>Drop Address</label>
                <input
                  type="text"
                  name="dropAddress"
                  value={formData.dropAddress}
                  onChange={handleChange}
                  placeholder="Enter drop address"
                  required
                />
              </div>
              <div className="coords-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.dropCoordinates.lat}
                    onChange={(e) => handleCoordinateChange('dropCoordinates', 'lat', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.dropCoordinates.lng}
                    onChange={(e) => handleCoordinateChange('dropCoordinates', 'lng', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Package Details</legend>
              <div className="form-row">
                <div className="form-group">
                  <label>Length (cm)</label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Breadth (cm)</label>
                  <input
                    type="number"
                    name="breadth"
                    value={formData.breadth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Actual Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="actualWeight"
                  value={formData.actualWeight}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>Shipping Options</legend>
              <div className="form-row">
                <div className="form-group">
                  <label>Order Type</label>
                  <select
                    name="orderType"
                    value={formData.orderType}
                    onChange={handleChange}
                  >
                    <option value="B2C">B2C (Business to Consumer)</option>
                    <option value="B2B">B2B (Business to Business)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Type</label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleChange}
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <button
              type="button"
              onClick={handleCalculateCharge}
              disabled={loading}
              className="calculate-btn"
            >
              {loading ? 'Calculating...' : '💰 Calculate Charge'}
            </button>
          </form>
        </div>

        {chargeData && (
          <div className="charge-summary">
            <h2>Charge Breakdown</h2>
            <div className="charge-item">
              <span>Volumetric Weight:</span>
              <span>{chargeData.volumetricWeight} kg</span>
            </div>
            <div className="charge-item">
              <span>Billable Weight:</span>
              <span>{chargeData.billableWeight} kg</span>
            </div>
            <div className="charge-item">
              <span>Weight Slab:</span>
              <span>{chargeData.weightSlab}</span>
            </div>
            <div className="charge-item">
              <span>Zone Type:</span>
              <span>{chargeData.isSameZone ? 'Intra-Zone' : 'Inter-Zone'}</span>
            </div>
            <hr />
            <div className="charge-item">
              <span>Base Charge:</span>
              <span className="amount">₹{chargeData.baseCharge}</span>
            </div>
            {chargeData.codSurcharge > 0 && (
              <div className="charge-item">
                <span>COD Surcharge:</span>
                <span className="amount">₹{chargeData.codSurcharge}</span>
              </div>
            )}
            <div className="charge-item total">
              <span>Total Charge:</span>
              <span className="amount">₹{chargeData.total}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="place-order-btn"
            >
              {loading ? 'Placing Order...' : '✓ Confirm & Place Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceOrder;
