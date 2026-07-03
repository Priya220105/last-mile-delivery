# Quick Setup Guide - 15 Minutes

Follow these steps to get the Last-Mile Delivery Tracker running locally.

## Step 1: Prerequisites (2 min)

Install:
- Node.js 16+ from https://nodejs.org
- Git from https://git-scm.com

Verify installation:
```bash
node --version   # should be v16+
npm --version    # should be v7+
```

## Step 2: MongoDB Setup (5 min)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account (or login)
3. Create new organization
4. Create new project (default settings)
5. Create a cluster:
   - Select "M0 Free" tier
   - Choose your region
   - Click "Create Cluster"
6. Wait for cluster to create (~3 minutes)
7. Click "Connect"
8. Choose "Drivers" option
9. Select Node.js driver
10. Copy connection string that looks like:
    ```
    mongodb+srv://username:password@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
    ```

## Step 3: Backend Setup (3 min)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
# Copy content from .env.example and paste your MongoDB URL

# Test connection
node init-db.js
# Should say: ✅ Database initialization completed!
```

If init-db.js gives error, check your MongoDB URL in .env.

## Step 4: Frontend Setup (2 min)

```bash
# Navigate to frontend folder
cd ../frontend

# Install dependencies
npm install
```

## Step 5: Run the Application (3 min)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
# Should show: Server running on http://localhost:5000
```

**Terminal 2 - Start Frontend (keep Terminal 1 running):**
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:3000
```

Open browser to **http://localhost:3000**

## Step 6: Login

Use these credentials:

**Customer Account:**
```
Email: customer@example.com
Password: password123
```

**Admin Account:**
```
Email: admin@example.com
Password: password123
```

**Agent Account:**
```
Email: agent@example.com
Password: password123
```

---

## Testing the Application

### As Customer:
1. Click "Place Order"
2. Fill in pickup & drop addresses (use any addresses)
3. Enter package dimensions and weight
4. Click "Calculate Charge"
5. See calculated charges based on your rate card
6. Click "Confirm & Place Order"
7. Click "My Orders" to see your order
8. Click on order to see tracking history

### As Admin:
1. See dashboard with stats
2. Click "Orders" to see all orders
3. Click "Zones" to add new zones with pincodes
4. Click "Rate Cards" to update pricing
5. Click "Agents" to see registered agents

### As Agent:
1. See "Assigned Orders"
2. Click on order to see details
3. Click status buttons to update order:
   - Picked Up
   - In Transit
   - Out for Delivery
   - Delivered or Failed

---

## Troubleshooting

### "MONGODB_URL is not set"
- Check that .env file exists in backend folder
- Check that MongoDB URL is copied correctly
- Restart backend server

### "Port 5000 already in use"
```bash
# Change PORT in backend/.env
PORT=5001
```

### "Cannot GET /api/orders"
- Make sure backend is running (`npm start` in backend folder)
- Check that frontend is trying to connect to correct port (should be 5000)

### "MongoError: connect ECONNREFUSED"
- Check MongoDB URL is correct
- Verify MongoDB Atlas cluster is running
- Check that your IP is whitelisted in MongoDB Atlas (should be automatic)

### "npm ERR! code ERESOLVE"
```bash
# Try installing with legacy peer deps
npm install --legacy-peer-deps
```

---

## File Structure Check

Verify you have all files:

```
last-mile-delivery/
├── backend/
│   ├── server.js ✓
│   ├── package.json ✓
│   ├── .env.example ✓
│   ├── init-db.js ✓
│   ├── middleware/auth.js ✓
│   ├── routes/auth.js ✓
│   ├── routes/orders.js ✓
│   ├── routes/admin.js ✓
│   └── helpers/rateCalculator.js ✓
├── frontend/
│   ├── index.html ✓
│   ├── package.json ✓
│   ├── vite.config.js ✓
│   └── src/
│       ├── main.jsx ✓
│       ├── App.jsx ✓
│       ├── App.css ✓
│       └── pages/ ✓
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── CustomerDashboard.jsx
│           ├── AdminDashboard.jsx
│           └── AgentDashboard.jsx
├── README.md ✓
├── SYSTEM_DESIGN.md ✓
├── SETUP_GUIDE.md ✓
└── .gitignore ✓
```

---

## Next Steps: Deployment

### Deploy Backend to Render (Free)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to https://render.com
3. Create new "Web Service"
4. Connect GitHub repo
5. Set environment variables:
   - `MONGODB_URL`: Your MongoDB connection string
   - `JWT_SECRET`: Any random string (e.g., `your-secret-key-12345`)
   - `NODE_ENV`: `production`
6. Deploy!
7. Note your backend URL (e.g., `https://delivery-tracker-api.render.com`)

### Deploy Frontend to Vercel (Free)

1. Go to https://vercel.com
2. Click "Import GitHub Project"
3. Select your repository
4. Set environment variable:
   - `VITE_API_URL`: Your Render backend URL
5. Deploy!

---

## Production Checklist

Before submitting:

- [ ] Backend is deployed and working
- [ ] Frontend is deployed and working
- [ ] All 3 demo accounts work
- [ ] Can create orders as customer
- [ ] Can update prices as admin
- [ ] Can update delivery status as agent
- [ ] README.md is complete
- [ ] SYSTEM_DESIGN.md is complete (800+ words)
- [ ] GitHub repository is public
- [ ] .env is in .gitignore (NOT committed)

---

## Support

Check detailed documentation:
- **Rate calculation:** See `SYSTEM_DESIGN.md` section 1
- **API endpoints:** See `README.md` API section
- **Database schema:** See `README.md` schema section
- **Deployment:** See `README.md` deployment section

---

**Estimated Time:** 15 minutes  
**Difficulty:** Easy  
**Skills Required:** Node.js, React, MongoDB basics
