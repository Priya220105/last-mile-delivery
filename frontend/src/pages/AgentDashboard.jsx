import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import '../styles/dashboard.css';

function AgentDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrders({ role: 'agent' });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!updateStatus || !selectedOrder) {
      alert('Please select a status');
      return;
    }

    try {
      await orderAPI.updateStatus(selectedOrder._id, updateStatus);
      alert('Order status updated!');
      setUpdateStatus('');
      setSelectedOrder(null);
      fetchAssignedOrders();
    } catch (error) {
      alert('Failed to update status');
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

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'Created': ['Picked Up'],
      'Picked Up': ['In Transit'],
      'In Transit': ['Out for Delivery'],
      'Out for Delivery': ['Delivered', 'Failed'],
      'Delivered': [],
      'Failed': ['Picked Up'] // Can retry
    };
    return statusFlow[currentStatus] || [];
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>🚚 Delivery Agent Dashboard</h1>
          <div className="user-menu">
            <span>Agent: {user?.name}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <section className="orders-section">
          <div className="section-header">
            <h2>My Assigned Orders</h2>
            <button onClick={fetchAssignedOrders} className="refresh-btn">🔄 Refresh</button>
          </div>

          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <p>No orders assigned yet.</p>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div 
                  key={order._id} 
                  className={`order-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
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
                    <div className="location-info">
                      <p><strong>📍 Pickup:</strong> {order.pickupAddress}</p>
                      <p><strong>📍 Drop:</strong> {order.dropAddress}</p>
                    </div>
                    <p><strong>Weight:</strong> {order.billableWeight || order.actualWeight} kg</p>
                    <p><strong>Package:</strong> {order.length}×{order.breadth}×{order.height} cm</p>
                    <p><strong>Type:</strong> {order.orderType} | {order.paymentType}</p>
                    <p><strong>Amount:</strong> ₹{order.chargeBreakdown?.total}</p>
                  </div>

                  {selectedOrder?._id === order._id && (
                    <div className="order-actions">
                      <h4>Update Order Status</h4>
                      <select 
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                      >
                        <option value="">-- Select Status --</option>
                        {getNextStatuses(order.status).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleStatusUpdate}
                        className="primary-btn"
                        disabled={!updateStatus}
                      >
                        ✓ Confirm Update
                      </button>

                      <h4 style={{ marginTop: '15px' }}>Tracking History</h4>
                      <div className="tracking-list">
                        {order.tracking?.map((track, idx) => (
                          <div key={idx} className="tracking-item">
                            <span className="track-status">{track.status}</span>
                            <span className="track-time">
                              {new Date(track.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .order-actions {
          margin-top: 15px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          border-top: 2px solid #007bff;
        }

        .order-actions h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #333;
        }

        .order-actions select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .order-actions .primary-btn {
          width: 100%;
          padding: 10px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .order-actions .primary-btn:hover:not(:disabled) {
          background: #218838;
        }

        .order-actions .primary-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .tracking-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .tracking-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        .track-status {
          font-weight: bold;
          color: #007bff;
        }

        .track-time {
          color: #666;
        }

        .location-info {
          background: #f0f8ff;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .location-info p {
          margin: 5px 0;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

export default AgentDashboard;
