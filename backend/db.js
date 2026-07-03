import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let db;
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function connectDB() {
  try {
    await client.connect();
    db = client.db('lastmile_delivery');
    console.log('✅ MongoDB Connected');
    
    // Create indexes only if they don't already exist
const users = db.collection('users');
const orders = db.collection('orders');

const userIndexes = await users.indexes();

if (!userIndexes.some(index => index.name === 'email_1')) {
  await users.createIndex({ email: 1 }, { unique: true });
}

await orders.createIndex({ customerId: 1 });
await orders.createIndex({ agentId: 1 });
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

export function getDB() {
  return db;
}

export function getClient() {
  return client;
}
