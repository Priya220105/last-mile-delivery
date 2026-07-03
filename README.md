# Last-Mile Delivery Tracker

A complete delivery management platform with customers, delivery agents, and admin dashboard. Built with Node.js, Express, MongoDB, and React.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB Atlas account (free tier)
- Git

### Installation

#### 1. Clone or Create Project
```bash
cd last-mile-delivery
```

#### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```
MONGODB_URL=mongodb+srv://your-username:your-password@cluster0.mongodb.net/delivery-tracker?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production-12345
PORT=5000
NODE_ENV=development
```

**To create MongoDB Atlas cluster:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (M0 Free tier)
4. Create database user with username/password
5. Get connection string and replace in .env

#### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

#### 4. Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

Visit http://localhost:3000

---

## 📊 Database Schema

### Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (bcrypt hashed),
  name: String,
  role: "customer" | "admin" | "agent",
  createdAt: Date
}
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  customerId: ObjectId,
  agentId: ObjectId (null if not assigned),
  pickupAddress: String,
  dropAddress: String,
  length: Number (cm),
  breadth: Number (cm),
  height: Number (cm),
  actualWeight: Number (kg),
  orderType: "B2C" | "B2B",
  paymentType: "Prepaid" | "COD",
  chargeBreakdown: {
    baseCharge: Number,
    codSurcharge: Number,
    total: Number
  },
  status: "Created" | "Picked Up" | "In Transit" | "Out for Delivery" | "Delivered" | "Failed",
  tracking: [
    {
      status: String,
      timestamp: Date,
      actor: String (email)
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### Zones Collection
```javascript
{
  _id: ObjectId,
  name: String,
  pincodes: [String],
  createdAt: Date
}
```

#### Rate Cards Collection
```javascript
{
  _id: ObjectId,
  type: "B2B" | "B2C",
  rates: {
    intraZone: {
      "0-500g": Number,
      "500g-1kg": Number,
      "1-2kg": Number,
      "2-5kg": Number,
      "5kg+": Number
    },
    interZone: { ... }
  },
  codSurcharge: Number (percentage),
  createdAt: Date
}
```

---

## 💰 Rate Calculation Logic

### Step-by-Step Process

1. **Volumetric Weight Calculation**
   ```
   Volumetric Weight = (Length × Breadth × Height) / 5000
   ```

2. **Billable Weight**
   ```
   Billable Weight = MAX(Actual Weight, Volumetric Weight)
   ```

3. **Weight Slab Mapping**
   - 0-500g: 0-0.5 kg
   - 500g-1kg: 0.5-1 kg
   - 1-2kg: 1-2 kg
   - 2-5kg: 2-5 kg
   - 5kg+: > 5 kg

4. **Zone Detection**
   - Get pickup address pincode → find matching zone
   - Get drop address pincode → find matching zone
   - If same zone → use **intra-zone rate**
   - If different zones → use **inter-zone rate**

5. **Base Charge Lookup**
   ```
   Get rate card for order type (B2B or B2C)
   Look up rate card for: weight slab + zone type (intra/inter)
   Base Charge = Found rate
   ```

6. **COD Surcharge** (if payment type is COD)
   ```
   COD Surcharge = (Base Charge × COD Surcharge %) / 100
   ```

7. **Total Charge**
   ```
   Total = Base Charge + COD Surcharge
   ```

### Example Calculation
```
Pickup Pincode: 110001 (Zone: Delhi North)
Drop Pincode: 110002 (Zone: Delhi North) → INTRA-ZONE

Package: 20×15×10 cm, Actual Weight: 0.8 kg, Type: B2C

Volumetric Weight = (20 × 15 × 10) / 5000 = 0.6 kg
Billable Weight = MAX(0.8, 0.6) = 0.8 kg → Slab: 500g-1kg

Rate Card (B2C, Intra-Zone, 500g-1kg): ₹75

Charge Breakdown:
- Base Charge: ₹75
- COD Surcharge (if COD): ₹7.5 (10% of 75)
- Total: ₹82.5
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user (requires token)

### Orders
- `POST /api/orders/calculate-charge` - Calculate charge before creating order
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order details
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/assign-agent` - Assign agent to order (admin only)

### Admin
- `POST /api/admin/zones` - Create zone
- `GET /api/admin/zones` - Get all zones
- `PUT /api/admin/zones/:id` - Update zone
- `POST /api/admin/rate-cards` - Create/update rate card
- `GET /api/admin/rate-cards` - Get all rate cards
- `GET /api/admin/orders` - Get all orders (admin view)
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/agents` - Get all agents

---

## 👥 Default Demo Accounts

Use these to test the application:

### Customer
- Email: `customer@example.com`
- Password: `password123`

### Admin
- Email: `admin@example.com`
- Password: `password123`

### Agent
- Email: `agent@example.com`
- Password: `password123`

---

## 📦 Project Structure

```
last-mile-delivery/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   └── admin.js
│   └── helpers/
│       └── rateCalculator.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── CustomerDashboard.jsx
│           ├── AdminDashboard.jsx
│           └── AgentDashboard.jsx
└── README.md
```

---

## 🚀 Deployment

### Deploy Backend to Render

1. Push code to GitHub
2. Go to https://render.com
3. Create new "Web Service"
4. Connect GitHub repository
5. Set environment variables:
   - `MONGODB_URL`: Your MongoDB connection string
   - `JWT_SECRET`: Your secret key
   - `NODE_ENV`: production
6. Deploy

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to https://vercel.com
3. Import project
4. Set environment variable:
   - `VITE_API_URL`: Your backend Render URL
5. Deploy

---

## ✨ Features Implemented

✅ User registration and login with JWT auth
✅ Three user roles: Customer, Admin, Agent
✅ Order creation with automatic rate calculation
✅ Zone-based pricing (intra-zone vs inter-zone)
✅ Volumetric weight calculation
✅ COD surcharge handling
✅ Order status tracking with immutable history
✅ Admin dashboard for managing zones and rates
✅ Agent dashboard for order updates
✅ Customer dashboard for tracking orders
✅ Rate card management (B2B and B2C)
✅ Order filtering and search
✅ Responsive UI

---

## 🔮 Future Enhancements

- Email and SMS notifications
- Real-time auto-assignment of nearest agent
- Live location tracking for agents
- Failed delivery rescheduling
- Payment gateway integration
- PDF invoice generation
- Analytics and reporting
- Mobile app

---

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB
- JWT for authentication
- bcryptjs for password hashing

**Frontend:**
- React
- Vite
- Axios for HTTP requests
- CSS for styling

---

## 📝 Notes

- All passwords are hashed using bcryptjs
- JWT tokens expire in 7 days
- Rate calculation is configurable and has no hardcoded values
- All status changes are logged with timestamp and actor information
- The system supports both B2B and B2C order types
- MongoDB Atlas free tier includes 512MB storage (sufficient for MVP)

---

## 🤝 Support

For issues or questions, check the API responses which include detailed error messages.

---

**Status:** ✅ Ready for Production  
**Last Updated:** 2026-07-02  
**Version:** 1.0.0
