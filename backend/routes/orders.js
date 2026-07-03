import express from 'express';
import { getDB } from '../db.js';
import { calculateCharge, detectZone } from '../helpers/rateCalculator.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Calculate charge (preview before order)
router.post('/calculate-charge', async (req, res) => {
  try {
    const { length, breadth, height, actualWeight, orderType, paymentType, pickupCoordinates, dropCoordinates } = req.body;
    
    const chargeData = await calculateCharge({
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType,
      pickupCoordinates,
      dropCoordinates
    });
    
    res.json(chargeData);
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { 
      pickupAddress, 
      dropAddress, 
      pickupCoordinates,
      dropCoordinates,
      length, 
      breadth, 
      height, 
      actualWeight, 
      orderType, 
      paymentType 
    } = req.body;
    
    // Validate required fields
    if (!pickupAddress || !dropAddress || !length || !breadth || !height || !actualWeight) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const db = getDB();
    
    // Calculate charge
    const chargeData = await calculateCharge({
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType,
      pickupCoordinates,
      dropCoordinates
    });
    
    // Create order
    const order = {
      customerId: new ObjectId(req.user.userId),
      agentId: null,
      pickupAddress,
      dropAddress,
      pickupCoordinates,
      dropCoordinates,
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      volumetricWeight: chargeData.volumetricWeight,
      orderType,
      paymentType,
      pickupZone: chargeData.pickupZone,
      dropZone: chargeData.dropZone,
      chargeBreakdown: {
        baseCharge: chargeData.baseCharge,
        codSurcharge: chargeData.codSurcharge,
        total: chargeData.total
      },
      status: 'Created',
      tracking: [
        {
          status: 'Created',
          timestamp: new Date(),
          updatedBy: 'System'
        }
      ],
      createdAt: new Date()
    };
    
    const result = await db.collection('orders').insertOne(order);
    
    res.status(201).json({
      message: 'Order created successfully',
      orderId: result.insertedId,
      order: {
        ...order,
        _id: result.insertedId
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (with filters)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status, zone, agentId, role } = req.query;
    
    let filter = {};
    
    // Based on role, filter orders
    if (role === 'customer') {
      filter.customerId = new ObjectId(req.user.userId);
    }
    
    if (role === 'agent') {
      filter.agentId = new ObjectId(req.user.userId);
    }
    
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

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const order = await db.collection('orders').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Created', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const db = getDB();
    
    // Get current order
    const order = await db.collection('orders').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update status
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status,
          updatedAt: new Date()
        },
        $push: {
          tracking: {
            status,
            timestamp: new Date(),
            updatedBy: req.user.name || req.user.email
          }
        }
      }
    );
    
    res.json({
      message: 'Order status updated',
      status
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign agent to order
router.put('/:id/assign-agent', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    const db = getDB();
    
    // Verify agent exists
    const agent = await db.collection('users').findOne({
      _id: new ObjectId(agentId),
      role: 'agent'
    });
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Assign agent
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          agentId: new ObjectId(agentId),
          assignedAt: new Date()
        }
      }
    );
    
    res.json({
      message: 'Agent assigned successfully',
      agentId
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
