import { getDB } from '../db.js';
import { ObjectId } from 'mongodb';

// Calculate distance between two coordinates (simplified)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Detect zone from coordinates
export async function detectZone(coordinates) {
  const db = getDB();
  const zones = await db.collection('zones').find({}).toArray();
  
  for (let zone of zones) {
    const { minLat, maxLat, minLng, maxLng } = zone.coordinates;
    if (coordinates.lat >= minLat && coordinates.lat <= maxLat &&
        coordinates.lng >= minLng && coordinates.lng <= maxLng) {
      return zone._id.toString();
    }
  }
  return null;
}

// Calculate volumetric weight
export function calculateVolumetricWeight(length, breadth, height) {
  return (length * breadth * height) / 5000;
}

// Get weight slab (used for rate lookup)
function getWeightSlab(weight) {
  if (weight <= 0.5) return '0-500g';
  if (weight <= 1) return '500g-1kg';
  if (weight <= 2) return '1-2kg';
  if (weight <= 5) return '2-5kg';
  return '5kg+';
}
// Main charge calculation
export async function calculateCharge(orderData) {
  try {
    const db = getDB();
    
    // Step 1: Detect zones
    const pickupZone = await detectZone(orderData.pickupCoordinates);
    const dropZone = await detectZone(orderData.dropCoordinates);
    
    if (!pickupZone || !dropZone) {
      throw new Error('Invalid coordinates - zone not found');
    }
    
    // Step 2: Calculate volumetric weight
    const volumetricWeight = calculateVolumetricWeight(
      orderData.length,
      orderData.breadth,
      orderData.height
    );
    
    // Step 3: Billable weight = max of actual and volumetric
    const billableWeight = Math.max(orderData.actualWeight, volumetricWeight);
    const weightSlab = getWeightSlab(billableWeight);
    
    // Step 4: Get rate card
    const rateCard = await db.collection('rateCards').findOne({
      type: orderData.orderType
    });
    
    if (!rateCard) {
      throw new Error(`No rate card found for ${orderData.orderType}`);
    }
    
    // Step 5: Determine if intra-zone or inter-zone
    const isSameZone = pickupZone === dropZone;
    const rateKey = isSameZone ? 'intraZone' : 'interZone';
    
    let baseCharge = rateCard.rates[rateKey][weightSlab];
    if (!baseCharge) {
      baseCharge = rateCard.rates[rateKey]['5kg+'] || 100;
    }
    
    // Step 6: Apply COD surcharge if applicable
    let codSurcharge = 0;
    if (orderData.paymentType === 'COD') {
      codSurcharge = Math.round(baseCharge * (rateCard.codSurcharge / 100));
    }
    
    const totalCharge = baseCharge + codSurcharge;
    
    return {
      pickupZone,
      dropZone,
      isSameZone,
      volumetricWeight: Math.round(volumetricWeight * 100) / 100,
      billableWeight: Math.round(billableWeight * 100) / 100,
      weightSlab,
      baseCharge,
      codSurcharge,
      total: totalCharge
    };
    
  } catch (error) {
    throw new Error(`Charge calculation failed: ${error.message}`);
  }
}
