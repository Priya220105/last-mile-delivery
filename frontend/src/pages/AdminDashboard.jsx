import React, { useState, useEffect } from 'react';
import { adminAPI, orderAPI } from '../services/api';
import '../styles/dashboard.css';

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [rateForm, setRateForm] = useState({
    type: 'B2C',
    codSurcharge: 10
  });

  const [zoneForm, setZoneForm] = useState({
    name: '',
    areas: '',
    coordinates: {
      minLat: 28.5,
      maxLat: 28.7,
      minLng: 77.0,
      maxLng: 77.3
    }
  });

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'agents') fetchAgents();
    if (activeTab === 'rates') fetchRateCards();
    if (activeTab === 'zones') fetchZones();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await adminAPI.getAgents();
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchRateCards = async () => {
    try {
      const response = await adminAPI.getRateCards();
      setRateCards(response.data);
    } catch (error) {
      console.error('Failed to fetch rate cards:', error);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await adminAPI.getZones();
      setZones(response.data);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  const handleCreateRateCard = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createRateCard({
        type: rateForm.type,
        rates: {
          intraZone: {
            '0-500g': 50,
            '500g-1kg': 75,
            '1kg-2kg': 100,
            '2kg-5kg': 150,
            '5kg+': 200
          },
          interZone: {
            '0-500g': 100,
            '500g-1kg': 150,
            '1kg-2kg': 200,
            '2kg-5kg': 300,
            '5kg+': 400
          }
        },
        codSurcharge: parseInt(rateForm.codSurcharge)
      });
      alert('Rate card created/updated!');
      fetchRateCards();
    } catch (error) {
      alert('Failed to create rate card');
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createZone({
        name: zoneForm.name,
        areas: zoneForm.areas.split(',').map(a => a.trim()),
        coordinates: zoneForm.coordinates
      });
      alert('Zone created!');
      fetchZones();
      setZoneForm({
        name: '',
        areas: '',
        coordinates: {
          minLat: 28.5,
          maxLat: 28.7,
          minLng: 77.0,
          maxLng: 77.3
        }
      });
    } catch (error) {
      alert('Failed to create zone');
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>⚙️ Admin Dashboard</h1>
          <div className="user-menu">
            <span>Admin: {user?.name}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'stats' ? 'active' : ''} 
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders
        </button>
        <button 
          className={activeTab === 'agents' ? 'active' : ''} 
          onClick={() => setActiveTab('agents')}
        >
          👥 Agents
        </button>
        <button 
          className={activeTab === 'rates' ? 'active' : ''} 
          onClick={() => setActiveTab('rates')}
        >
          💰 Rate Cards
        </button>
        <button 
          className={activeTab === 'zones' ? 'active' : ''} 
          onClick={() => setActiveTab('zones')}
        >
          🗺️ Zones
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'stats' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Delivered</h3>
              <p className="stat-value">{stats.deliveredOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Failed</h3>
              <p className="stat-value">{stats.failedOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Delivery Rate</h3>
              <p className="stat-value">{stats.deliveryRate}%</p>
            </div>
            <div className="stat-card">
              <h3>Active Agents</h3>
              <p className="stat-value">{stats.totalAgents}</p>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2>All Orders</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>From → To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.toString().slice(-6)}</td>
                      <td>{order.customerId}</td>
                      <td>{order.pickupAddress.slice(0, 15)}... → {order.dropAddress.slice(0, 15)}...</td>
                      <td>₹{order.chargeBreakdown?.total}</td>
                      <td><span className="status-badge">{order.status}</span></td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div>
            <h2>Delivery Agents</h2>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent._id}>
                    <td>{agent.name}</td>
                    <td>{agent.email}</td>
                    <td>({agent.location?.lat || 0}, {agent.location?.lng || 0})</td>
                    <td>{new Date(agent.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="admin-section">
            <div className="admin-form">
              <h2>Create/Update Rate Card</h2>
              <form onSubmit={handleCreateRateCard}>
                <div className="form-group">
                  <label>Order Type</label>
                  <select 
                    value={rateForm.type}
                    onChange={(e) => setRateForm({...rateForm, type: e.target.value})}
                  >
                    <option value="B2C">B2C</option>
                    <option value="B2B">B2B</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>COD Surcharge (%)</label>
                  <input
                    type="number"
                    value={rateForm.codSurcharge}
                    onChange={(e) => setRateForm({...rateForm, codSurcharge: e.target.value})}
                  />
                </div>
                <button type="submit" className="primary-btn">Save Rate Card</button>
              </form>
            </div>

            <div className="rate-cards-list">
              <h2>Existing Rate Cards</h2>
              {rateCards.map(card => (
                <div key={card._id} className="rate-card-item">
                  <h3>{card.type}</h3>
                  <p><strong>COD Surcharge:</strong> {card.codSurcharge}%</p>
                  <p><strong>Intra-zone:</strong> {JSON.stringify(card.rates.intraZone)}</p>
                  <p><strong>Inter-zone:</strong> {JSON.stringify(card.rates.interZone)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="admin-section">
            <div className="admin-form">
              <h2>Create Zone</h2>
              <form onSubmit={handleCreateZone}>
                <div className="form-group">
                  <label>Zone Name</label>
                  <input
                    type="text"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})}
                    placeholder="e.g., Delhi North"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Areas (comma-separated)</label>
                  <input
                    type="text"
                    value={zoneForm.areas}
                    onChange={(e) => setZoneForm({...zoneForm, areas: e.target.value})}
                    placeholder="e.g., Sector 1, Sector 2, Sector 3"
                    required
                  />
                </div>
                <div className="coords-group">
                  <div className="form-group">
                    <label>Min Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={zoneForm.coordinates.minLat}
                      onChange={(e) => setZoneForm({...zoneForm, coordinates: {...zoneForm.coordinates, minLat: e.target.value}})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={zoneForm.coordinates.maxLat}
                      onChange={(e) => setZoneForm({...zoneForm, coordinates: {...zoneForm.coordinates, maxLat: e.target.value}})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Min Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={zoneForm.coordinates.minLng}
                      onChange={(e) => setZoneForm({...zoneForm, coordinates: {...zoneForm.coordinates, minLng: e.target.value}})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={zoneForm.coordinates.maxLng}
                      onChange={(e) => setZoneForm({...zoneForm, coordinates: {...zoneForm.coordinates, maxLng: e.target.value}})}
                    />
                  </div>
                </div>
                <button type="submit" className="primary-btn">Create Zone</button>
              </form>
            </div>

            <div className="zones-list">
              <h2>Existing Zones</h2>
              {zones.map(zone => (
  <div key={zone._id} className="zone-card">
    <h3>{zone.name}</h3>
    <p><strong>Areas:</strong> {(zone.areas || zone.pincodes || []).join(', ')}</p>
    <p><strong>Coordinates:</strong> {zone.coordinates ? `(${zone.coordinates.minLat}, ${zone.coordinates.minLng}) to (${zone.coordinates.maxLat}, ${zone.coordinates.maxLng})` : 'N/A'}</p>
  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
