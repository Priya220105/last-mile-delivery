import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import '../styles/dashboard.css';

function Dashboard({ user, onLogout, onPlaceOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrders({ role: 'customer' });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Created': '#FFA500',
      'Picked Up': '#4169E1',
      'In Transit': '#1E90FF',
      'Out for Delivery': '#32CD32',
      'Delivered': '#228B22',
      'Failed': '#DC143C'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>📦 Last-Mile Delivery</h1>
          <div className="user-menu">
            <span>Welcome, {user?.name}!</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <section className="orders-section">
          <div className="section-header">
            <h2>Your Orders</h2>
            <button onClick={onPlaceOrder} className="primary-btn">+ Place New Order</button>
          </div>

          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <p>No orders yet. Click "Place New Order" to get started!</p>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div 
                  key={order._id} 
                  className="order-card"
                  onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                >
                  <div className="order-header">
                    <h3>Order #{order._id.toString().slice(-6).toUpperCase()}</h3>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="order-details">
                    <p><strong>From:</strong> {order.pickupAddress}</p>
                    <p><strong>To:</strong> {order.dropAddress}</p>
                    <p><strong>Weight:</strong> {order.billableWeight || order.actualWeight} kg</p>
                    <p><strong>Charge:</strong> ₹{order.chargeBreakdown?.total}</p>
                    <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>

                  {selectedOrder?._id === order._id && (
                    <div className="order-tracking">
                      <h4>Tracking History</h4>
                      {order.tracking?.map((track, idx) => (
                        <div key={idx} className="tracking-item">
                          <span className="track-status">{track.status}</span>
                          <span className="track-time">
                            {new Date(track.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
