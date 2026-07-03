import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URI;

const zoneCoordinates = {
  'Delhi West':  { minLat: 28.65, maxLat: 28.90, minLng: 76.80, maxLng: 77.05 },
  'Gurgaon':     { minLat: 28.30, maxLat: 28.65, minLng: 76.80, maxLng: 77.05 },
  'Delhi North': { minLat: 28.65, maxLat: 28.90, minLng: 77.05, maxLng: 77.30 },
  'Delhi South': { minLat: 28.30, maxLat: 28.65, minLng: 77.05, maxLng: 77.30 },
  'Noida':       { minLat: 28.30, maxLat: 28.90, minLng: 77.30, maxLng: 77.50 }
};

async function updateZones() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('lastmile_delivery');
    const zonesCollection = db.collection('zones');

    for (const [name, coordinates] of Object.entries(zoneCoordinates)) {
      const result = await zonesCollection.updateOne(
        { name },
        {
          $set: { coordinates },
          $setOnInsert: { pincodes: [], createdAt: new Date() }
        },
        { upsert: true }
      );
      if (result.matchedCount > 0) {
        console.log(`✅ Updated ${name} with coordinates`);
      } else if (result.upsertedCount > 0) {
        console.log(`✅ Created new zone: ${name}`);
      }
    }

    console.log('\n✅ Zone coordinates update completed!');

  } catch (error) {
    console.error('Error updating zones:', error);
  } finally {
    await client.close();
  }
}

updateZones();