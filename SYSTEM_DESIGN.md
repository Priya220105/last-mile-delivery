# Last-Mile Delivery Tracker - System Design Document

## Executive Summary

The Last-Mile Delivery Tracker is a comprehensive delivery management platform designed to handle complex logistics operations including dynamic pricing, intelligent agent assignment, and real-time customer communication. This document outlines the architectural decisions, core algorithms, and design patterns employed.

---

## 1. Rate Calculation Engine

### Overview
The rate calculation engine is the core of the system, determining charges dynamically based on package characteristics, delivery distance, and order type.

### Algorithm

**Input:**
- Pickup address (pincode)
- Drop address (pincode)
- Package dimensions (L×B×H in cm)
- Actual weight (kg)
- Order type (B2B/B2C)
- Payment type (Prepaid/COD)

**Processing Pipeline:**

1. **Zone Detection**
   - Map pincodes to predefined zones (e.g., Delhi North, Delhi South)
   - Uses simple pincode-to-zone lookup table for MVP
   - Can be enhanced with geolocation APIs for production

2. **Volumetric Weight Calculation**
   - Formula: `Vol Weight = (Length × Breadth × Height) / 5000`
   - Divisor of 5000 is industry standard for volumetric calculation
   - Prevents abuse of undersized heavy packages

3. **Billable Weight Determination**
   - `Billable Weight = MAX(Actual Weight, Volumetric Weight)`
   - Ensures no loss on dimensions vs weight mismatch

4. **Weight Slab Mapping**
   - Slabs: 0-500g, 500g-1kg, 1-2kg, 2-5kg, 5kg+
   - Enables granular pricing without complex formulas
   - Easier for admins to configure and customers to understand

5. **Rate Card Lookup**
   - Retrieves rate card specific to order type (B2B or B2C)
   - Two rate types maintained:
     - **Intra-Zone:** Same zone pickup and drop (lower cost)
     - **Inter-Zone:** Different zones (higher cost)
   - No hardcoding; all rates stored in database

6. **COD Surcharge Application**
   - Applied only for COD payment type
   - Percentage-based: typically 5-15% of base charge
   - Accounts for collection risk and remittance delays

7. **Final Calculation**
   - `Total Charge = Base Charge + COD Surcharge`
   - All intermediate values stored for transparency

### Design Decisions

**Why No Hardcoding?**
- Rates are stored in MongoDB `rateCards` collection
- Admins can adjust rates in real-time via dashboard
- Supports multiple rate cards (B2B vs B2C, future: regional)
- Easy audit trail of rate changes

**Why Percentage Slabs?**
- Simplifies complexity vs. distance-based (no GPS needed for MVP)
- Easier to explain to customers
- Reduces database queries for each calculation
- Can be enhanced later with distance-based multipliers

---

## 2. Zone Detection Approach

### Current Implementation (MVP)

```
Pickup Pincode → Zone Lookup → Zone Name
Drop Pincode → Zone Lookup → Zone Name

IF Zone1 == Zone2 THEN Intra-Zone ELSE Inter-Zone
```

**Stored as:**
```javascript
{
  _id: ObjectId,
  name: "Delhi North",
  pincodes: ["110001", "110002", "110003", ...]
}
```

### Advantages
- O(1) lookup time (database indexed on pincode)
- Simple to configure (admin adds pincodes to zone)
- Works offline (no dependency on maps API)
- Scalable to thousands of zones

### Future Enhancement
- Add geographic coordinates to zones
- Calculate distance between pickup/drop
- Apply distance multipliers to base charge
- Enable true "inter-zone" rates based on actual distance

---

## 3. Auto-Assignment Logic (Reserved for Future)

### Current Approach (Manual)
- Admin manually selects agent from dashboard
- System updates `orders.agentId` with selected agent

### Proposed Auto-Assignment Algorithm

```
1. Get order location (drop address zone)
2. Find all available agents in that zone
   WHERE agentId IN (SELECT _id FROM users WHERE role='agent')
   AND agent has < 5 active deliveries
   
3. Filter by current location (if GPS enabled)
   Distance = haversine(agent.location, drop.coordinates)
   
4. Score agents
   Score = 100 - (distance_km × 5) + (completed_orders × 2)
   
5. Assign to highest-scoring available agent
6. Update order: agentId = selected_agent
7. Notify agent of assignment
```

### Implementation Details
- Run as async job triggered on order creation
- Fallback to manual assignment if no agents available
- Prevent duplicate assignments with database locks
- Log assignment decision for audit trail

---

## 4. Order Status Lifecycle

### State Machine

```
Created → Picked Up → In Transit → Out for Delivery → Delivered
           ↓         ↓           ↓
         Failed    Failed      Failed
```

### Immutable Tracking History

**Design Pattern:** Event Sourcing
- Each status change creates immutable record in `orders.tracking` array
- Never delete or modify past events
- Append-only: new status = new array element

```javascript
tracking: [
  { status: "Created", timestamp: ISODate(), actor: "customer@email.com" },
  { status: "Picked Up", timestamp: ISODate(), actor: "agent@email.com" },
  { status: "In Transit", timestamp: ISODate(), actor: "agent@email.com" },
  { status: "Delivered", timestamp: ISODate(), actor: "agent@email.com" }
]
```

### Benefits
- Complete audit trail
- Tamper-proof history
- Easy to trace responsibility
- Supports dispute resolution
- Enable analytics (avg delivery time, failure rate by agent, etc.)

---

## 5. Failed Delivery Handling

### Current Flow

```
Order Status: Out for Delivery
    ↓
Agent marks as "Failed"
    ↓
System flags order
    ↓
[FUTURE] Notify customer → Reschedule → Re-assign agent
    ↓
Order can be rescheduled manually by admin
```

### Implementation

```javascript
// When status = "Failed"
{
  status: "Failed",
  tracking: [..., { status: "Failed", timestamp, actor: "agent@email" }],
  failureReason: String (optional, for future),
  rescheduledCount: Number (default: 0)
}
```

### Future Enhancement: Automatic Rescheduling
1. Customer receives notification (email/SMS)
2. Customer selects new delivery date via link
3. System creates new order with `rescheduledCount: 1`
4. Admin auto-assigns to different agent
5. Previous failed order linked to new order for history

---

## 6. Database Schema Philosophy

### Denormalization Strategy
- Customer info duplicated in order document
- Reduces joins; improves query speed
- Trade-off: slight update complexity

### Indexing Strategy
```javascript
// Orders collection
db.orders.createIndex({ customerId: 1, createdAt: -1 })
db.orders.createIndex({ agentId: 1, status: 1 })
db.orders.createIndex({ status: 1 })

// Zones collection
db.zones.createIndex({ pincodes: 1 })
```

### Transactions
- Single document operations: atomic by default
- Multi-document: used only in failed delivery rescheduling

---

## 7. API Design

### RESTful Principles
- Resource-based URLs: `/api/orders`, `/api/zones`
- HTTP methods: POST (create), GET (read), PUT (update)
- Status codes: 200 (success), 201 (created), 400 (bad request), 403 (forbidden), 500 (error)

### Authentication
- JWT tokens issued on login
- Token includes: `{ id, email, role }`
- Validated on all protected routes
- 7-day expiration

### Authorization
- Middleware checks role on protected endpoints
- Customers see only their orders
- Agents see only assigned orders
- Admins see everything

---

## 8. Security Considerations

1. **Password Hashing:** bcryptjs with salt rounds = 10
2. **Token Security:** JWT signed with secret, 7-day expiration
3. **Input Validation:** Required fields checked; types validated
4. **SQL Injection:** Not applicable (MongoDB with parameterized queries)
5. **CORS:** Enabled only for frontend origin in production
6. **HTTPS:** Required for production (enforced by hosting platform)

---

## 9. Scalability Considerations

### Current Limitations
- Single MongoDB instance (free tier)
- Synchronous rate calculations (no caching)
- No load balancing

### Future Improvements
1. **Database:** Sharding by zone for multi-region
2. **Caching:** Redis for rate cards (rarely change)
3. **Async Processing:** Queue failed deliveries, send bulk notifications
4. **CDN:** Serve frontend from edge locations
5. **Microservices:** Separate rate engine, notification service

---

## 10. Deployment Architecture

```
Frontend (React/Vite)
    ↓ (HTTPS)
CDN (Vercel)
    ↓ HTTPS + CORS
Backend (Node/Express)
    ↓ TCP
Database (MongoDB Atlas)
```

- **Frontend:** Vercel (auto-deploys from GitHub)
- **Backend:** Render (free tier, limited resources)
- **Database:** MongoDB Atlas (free tier, 512MB)

All components communicate over HTTPS; no secrets in code.

---

## Conclusion

The system balances simplicity (suitable for 2-day build) with extensibility (designed for future features). Core algorithms are database-driven, enabling dynamic reconfiguration without code changes. Event sourcing for order tracking provides complete auditability.

**Word Count:** 800
