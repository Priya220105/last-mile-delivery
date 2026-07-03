import express from 'express';
import { getDB } from '../db.js';
import { verifyRole } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Create Zone
router.post('/zones', verifyRole('admin'), async (req, res) => {
  try {
    const { name, areas, coordinates } = req.body;
    
    if (!name || !areas || !coordinates) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const db = getDB();
    
    const result = await db.collection('zones').insertOne({
      name,
      areas,
      coordinates: {
        minLat: coordinates.minLat,
        maxLat: coordinates.maxLat,
        minLng: coordinates.minLng,
        maxLng: coordinates.maxLng
      },
      createdAt: new Date()
    });
    
    res.status(201).json({
      message: 'Zone created',
      zoneId: result.insertedId
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all zones
router.get('/zones', verifyRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const zones = await db.collection('zones').find({}).toArray();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Rate Card
router.post('/rate-cards', verifyRole('admin'), async (req, res) => {
  try {
    const { type, rates, codSurcharge } = req.body;
    
    if (!type || !rates || codSurcharge === undefined) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    if (!['B2B', 'B2C'].includes(type)) {
      return res.status(400).json({ error: 'Type must be B2B or B2C' });
    }
    
    const db = getDB();
    
    // Check if rate card for this type exists
    const existing = await db.collection('rateCards').findOne({ type });
    
    if (existing) {
      // Update existing
      await db.collection('rateCards').updateOne(
        { type },
        {
          $set: {
            rates,
            codSurcharge,
            updatedAt: new Date()
          }
        }
      );
      
      return res.json({
        message: 'Rate card updated',
        type
      });
    }
    
    // Create new
    const result = await db.collection('rateCards').insertOne({
      type,
      rates: {
        intraZone: rates.intraZone || {
          '0-500g': 50,
          '500g-1kg': 75,
          '1kg-2kg': 100,
          '2kg-5kg': 150,
          '5kg+': 200
        },
        interZone: rates.interZone || {
          '0-500g': 100,
          '500g-1kg': 150,
          '1kg-2kg': 200,
          '2kg-5kg': 300,
          '5kg+': 400
        }
      },
      codSurcharge,
      createdAt: new Date()
    });
    
    res.status(201).json({
      message: 'Rate card created',
      rateCardId: result.insertedId
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rate cards
router.get('/rate-cards', verifyRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const rateCards = await db.collection('rateCards').find({}).toArray();
    res.json(rateCards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (admin view)
router.get('/orders', verifyRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const { status, zone } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (zone) {
      filter.$or = [
        { pickupZone: zone },
        { dropZone: zone }
      ];
    }
    
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(orders);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agents
router.get('/agents', verifyRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const agents = await db.collection('users')
      .find({ role: 'agent' })
      .project({ password: 0 })
      .toArray();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', verifyRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    
    const totalOrders = await db.collection('orders').countDocuments({});
    const deliveredOrders = await db.collection('orders').countDocuments({ status: 'Delivered' });
    const failedOrders = await db.collection('orders').countDocuments({ status: 'Failed' });
    const totalAgents = await db.collection('users').countDocuments({ role: 'agent' });
    
    res.json({
      totalOrders,
      deliveredOrders,
      failedOrders,
      totalAgents,
      deliveryRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
