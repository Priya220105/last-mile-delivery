import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URI;
async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('lastmile_delivery');

    // Clear existing data (optional - comment out if you want to keep data)
    // await db.dropDatabase();
    // console.log('Database cleared');

    // Create Users
    console.log('Creating demo users...');
    const usersCollection = db.collection('users');
    const hashedPassword = await bcrypt.hash('password123', 10);

    await usersCollection.insertMany([
      {
        email: 'customer@example.com',
        password: hashedPassword,
        name: 'John Customer',
        role: 'customer',
        createdAt: new Date()
      },
      {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date()
      },
      {
        email: 'agent@example.com',
        password: hashedPassword,
        name: 'Delivery Agent',
        role: 'agent',
        createdAt: new Date()
      }
    ]);
    console.log('✅ Demo users created');

    // Create Zones
    console.log('Creating zones...');
    const zonesCollection = db.collection('zones');
    await zonesCollection.insertMany([
      {
        name: 'Delhi North',
        pincodes: ['110001', '110005', '110007', '110009', '110035', '110037'],
        createdAt: new Date()
      },
      {
        name: 'Delhi South',
        pincodes: ['110002', '110003', '110004', '110011', '110012', '110016'],
        createdAt: new Date()
      },
      {
        name: 'Delhi West',
        pincodes: ['110006', '110015', '110018', '110027', '110028'],
        createdAt: new Date()
      },
      {
        name: 'Gurgaon',
        pincodes: ['122001', '122002', '122003', '122004', '122005'],
        createdAt: new Date()
      },
      {
        name: 'Noida',
        pincodes: ['201301', '201302', '201303', '201304', '201305'],
        createdAt: new Date()
      }
    ]);
    console.log('✅ Zones created');

    // Create Rate Cards
    console.log('Creating rate cards...');
    const rateCardsCollection = db.collection('rateCards');
    await rateCardsCollection.insertMany([
      {
        type: 'B2C',
        rates: {
          intraZone: {
            '0-500g': 50,
            '500g-1kg': 75,
            '1-2kg': 100,
            '2-5kg': 150,
            '5kg+': 200
          },
          interZone: {
            '0-500g': 100,
            '500g-1kg': 150,
            '1-2kg': 200,
            '2-5kg': 300,
            '5kg+': 400
          }
        },
        codSurcharge: 10,
        createdAt: new Date()
      },
      {
        type: 'B2B',
        rates: {
          intraZone: {
            '0-500g': 40,
            '500g-1kg': 60,
            '1-2kg': 80,
            '2-5kg': 120,
            '5kg+': 160
          },
          interZone: {
            '0-500g': 80,
            '500g-1kg': 120,
            '1-2kg': 160,
            '2-5kg': 240,
            '5kg+': 320
          }
        },
        codSurcharge: 8,
        createdAt: new Date()
      }
    ]);
    console.log('✅ Rate cards created');

    // Create Indexes
    console.log('Creating indexes...');
    await usersCollection.createIndex({ email: 1 });
    await zonesCollection.createIndex({ pincodes: 1 });
    await rateCardsCollection.createIndex({ type: 1 });

    const ordersCollection = db.collection('orders');
    await ordersCollection.createIndex({ customerId: 1, createdAt: -1 });
    await ordersCollection.createIndex({ agentId: 1, status: 1 });
    await ordersCollection.createIndex({ status: 1 });

    console.log('✅ Indexes created');

    console.log('\n✅ Database initialization completed!');
    console.log('\n📝 Demo Credentials:');
    console.log('---');
    console.log('Customer:');
    console.log('  Email: customer@example.com');
    console.log('  Password: password123');
    console.log('\nAdmin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    console.log('\nAgent:');
    console.log('  Email: agent@example.com');
    console.log('  Password: password123');
    console.log('---\n');

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
  }
}

initializeDatabase();
