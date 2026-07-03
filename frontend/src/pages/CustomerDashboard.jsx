import { useState, useEffect } from 'react'
import axios from 'axios'

export default function CustomerDashboard({ user, token, onLogout }) {
  const [currentTab, setCurrentTab] = useState('place-order')
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropAddress: '',
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'Prepaid'
  })
  const [chargeBreakdown, setChargeBreakdown] = useState(null)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders', axiosConfig)
      setOrders(response.data.orders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCalculateCharge = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/orders/calculate-charge', formData)
      setChargeBreakdown(response.data.chargeBreakdown)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate charge')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(
        '/api/orders',
        {
          ...formData,
          chargeBreakdown
        },
        axiosConfig
      )
      setSuccess('Order placed successfully!')
      setFormData({
        pickupAddress: '',
        dropAddress: '',
        length: '',
        breadth: '',
        height: '',
        actualWeight: '',
        orderType: 'B2C',
        paymentType: 'Prepaid'
      })
      setChargeBreakdown(null)
      setTimeout(() => {
        setSuccess('')
        fetchOrders()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'Created': 'status-created',
      'Picked Up': 'status-picked-up',
      'In Transit': 'status-in-transit',
      'Out for Delivery': 'status-out-for-delivery',
      'Delivered': 'status-delivered',
      'Failed': 'status-failed'
    }
    return statusMap[status] || 'status-created'
  }

  return (
    <div>
      <div className="navbar">
        <div className="navbar-container">
          <h1>🚚 Delivery Tracker</h1>
          <div className="navbar-right">
            <span>{user.name} ({user.role})</span>
            <button className="btn-danger" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setCurrentTab('place-order')}
            style={{ marginRight: '10px', fontWeight: currentTab === 'place-order' ? 'bold' : 'normal' }}
          >
            Place Order
          </button>
          <button 
            onClick={() => setCurrentTab('my-orders')}
            style={{ fontWeight: currentTab === 'my-orders' ? 'bold' : 'normal' }}
          >
            My Orders ({orders.length})
          </button>
        </div>

        {currentTab === 'place-order' && (
          <div className="card">
            <h2>📦 Place New Order</h2>
            
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={handleCalculateCharge}>
              <div className="form-group">
                <label>Pickup Address</label>
                <textarea
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  placeholder="Enter complete pickup address"
                  required
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="form-group">
                <label>Drop Address</label>
                <textarea
                  name="dropAddress"
                  value={formData.dropAddress}
                  onChange={handleChange}
                  placeholder="Enter complete drop address"
                  required
                  style={{ minHeight: '80px' }}
                />
              </div>

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
              </div>

              <div className="form-row">
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
                <div className="form-group">
                  <label>Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="actualWeight"
                    value={formData.actualWeight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                    <option value="COD">COD (Cash on Delivery)</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Calculating...' : 'Calculate Charge'}
              </button>
            </form>

            {chargeBreakdown && (
              <div className="charge-breakdown">
                <p>
                  <span>Base Charge:</span>
                  <strong>₹{chargeBreakdown.baseCharge}</strong>
                </p>
                {chargeBreakdown.codSurcharge > 0 && (
                  <p>
                    <span>COD Surcharge:</span>
                    <strong>₹{chargeBreakdown.codSurcharge}</strong>
                  </p>
                )}
                <p>
                  <span>Billable Weight:</span>
                  <strong>{chargeBreakdown.billableWeight} kg</strong>
                </p>
                <p>
                  <span>Zone:</span>
                  <strong>{chargeBreakdown.isSameZone ? 'Intra-Zone' : 'Inter-Zone'}</strong>
                </p>
                <div className="total">
                  <span>Total Amount:</span>
                  <span>₹{chargeBreakdown.total}</span>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  className="btn-success"
                  style={{ marginTop: '15px', width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Confirm & Place Order'}
                </button>
              </div>
            )}
          </div>
        )}

        {currentTab === 'my-orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="card">
                <p>No orders yet. <a onClick={() => setCurrentTab('place-order')} style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>Place your first order</a></p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div 
                    key={order._id} 
                    className="order-item"
                    onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="order-info">
                      <div className="order-id">Order #{order._id.toString().slice(-8)}</div>
                      <div className="order-address">📍 From: {order.pickupAddress.split(' ').slice(0, 3).join(' ')}</div>
                      <div className="order-address">📍 To: {order.dropAddress.split(' ').slice(0, 3).join(' ')}</div>
                      <div className="order-address">₹ {order.chargeBreakdown?.total}</div>
                    </div>
                    <div className={`order-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {order.status}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedOrder && (
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>Order Details</h3>
                <div style={{ marginBottom: '15px' }}>
                  <p><strong>Order ID:</strong> {selectedOrder._id.toString()}</p>
                  <p><strong>Status:</strong> <span className={`order-status status-${selectedOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>{selectedOrder.status}</span></p>
                  <p><strong>Type:</strong> {selectedOrder.orderType}</p>
                  <p><strong>Payment:</strong> {selectedOrder.paymentType}</p>
                  <p><strong>Total Amount:</strong> ₹{selectedOrder.chargeBreakdown?.total}</p>
                  <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>

                <h4>📍 Tracking History</h4>
                <div className="tracking-timeline">
                  {selectedOrder.tracking?.map((track, idx) => (
                    <div key={idx} className="tracking-item">
                      <div className="tracking-dot">{idx + 1}</div>
                      <div className="tracking-content">
                        <div className="tracking-status">{track.status}</div>
                        <div className="tracking-time">{new Date(track.timestamp).toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>by {track.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
