# Enterprise Loan Management System (Backend)

Welcome to the backend repository for the Loan Management System. This project has been completely rebuilt from the ground up to address the fundamental flaws of the legacy system (bloatware, expensive queries, and monolithic architecture). 

This README serves as the ultimate technical blueprint for the backend. It outlines the architecture, database schema, and advanced strategies used to ensure infinite scalability and near-zero idle costs.

---

## 1. Project Overview & Philosophy
The goal of this backend is to provide lightning-fast data retrieval for a small, trusted internal team (~4 users) while maintaining a strict, audit-proof financial ledger.

**Key Improvements from Legacy System:**
- **Bloatware Removed:** Features like the heavy, redundant notification system have been completely stripped out to keep the codebase lean.
- **Serverless Architecture:** Replaced the expensive 24/7 Express.js monolith with Next.js API Routes (Serverless Functions) ensuring we only pay for compute when the API is actually processing a request.
- **Performance:** Migrated from `SKIP/LIMIT` offset pagination to **Cursor-based Pagination**, ensuring that query times remain `O(1)` (instant) even if the database grows to 10 million records.
- **Pre-computation:** Instead of calculating "who needs to pay today" on-the-fly, a Nightly Cron Job compiles this data while the staff is asleep, so the dashboard loads instantly at 9:00 AM.

---

## 2. Architecture Stack
- **Framework:** Next.js (API Routes) / Node.js
- **Database:** MongoDB Atlas (Serverless Instance)
- **ODM:** Mongoose
- **Authentication:** JWT (JSON Web Tokens) via NextAuth.js
- **Task Scheduling:** Vercel Cron Jobs (or GitHub Actions) for nightly caching.

---

## 3. Database Schema (Mongoose)

To maintain clean business logic, loan types are strictly segmented into their own collections, while payments and follow-ups are centralized.

### Core Collections
* **`Users`**: The 4 internal employees/admins `(username, passwordHash, role)`.
* **`Customers`**: The central identity ledger `(name, phone, aadhar, pan, address)`.

### Loan Collections
Segmented to ensure employees only see fields relevant to the specific loan type:
* **`DailyLoans`**
* **`WeeklyLoans`**
* **`MonthlyLoans`**
* **`VehicleLoans`** *(Includes specific fields: `chassisNumber`, `engineNumber`, `rtoStatus`)*
* *Common fields across all:* `customerId`, `principalAmount`, `status (Active/Closed)`, `nextFollowupDate`.

### Ledger Collections
* **`Payments`**: A unified append-only ledger for all EMIs `(loanId, loanType, amountPaid, date, paymentMode)`.
* **`FollowUps`**: A dedicated tracker for client promises `(loanId, loanType, promisedDate, employeeComment)`.

---

## 4. Core API Routes

### Authentication
- `POST /api/auth/login` - Validates employee and issues JWT.

### Loan & Customer Management
- `POST /api/customers` - Creates a global customer profile.
- `POST /api/loans/:type` - Creates a specific loan (e.g., Vehicle, Daily).
- `GET /api/loans/:type` - Fetches active loans. **Must implement Cursor Pagination** (`?cursor=last_id`).

### Interaction APIs (The Workflow)
- `POST /api/payments` - Logs an EMI and decrements the `remainingBalance` on the specific loan.
- `POST /api/followups` - Logs an employee's call note (e.g., "Customer will pay in 2 days"). **Crucially**, this route updates the `nextFollowupDate` on the parent Loan document so it instantly appears on the Daily Follow-up Dashboard.

### Dashboard & Analytics
- `GET /api/dashboard/daily` - Fetches the pre-computed list of today's follow-ups.
- `GET /api/collections/filter` - Takes `?startDate` and `?endDate` to compare expected vs actual collections.

---

## 5. Step-by-Step Execution Plan

*(Developer Note: Follow these steps strictly when writing code for this repository).*

### Step 1: Project Initialization
- Initialize Next.js project.
- Set up `.env` with `MONGODB_URI` and `JWT_SECRET`.
- Install `mongoose`, `jsonwebtoken`.

### Step 2: Database Models Setup
- Create the Mongoose schemas in `/models` exactly as outlined in Section 3. Ensure `Customers` are properly referenced via `ObjectId` in the Loan collections.

### Step 3: Core API Routing
- Build the Loan and Payment routes. 
- **Requirement:** Implement Cursor pagination for all `GET` lists.

### Step 4: The Follow-up Engine
- Implement the `/api/followups` logic. Ensure that when a promise-to-pay date is entered, the main Loan document's `nextFollowupDate` is updated concurrently.

### Step 5: The Nightly Cron Job
- Write a script at `/api/cron/generate-daily-dashboard`.
- Write the aggregation pipeline that scans all 4 Loan collections for `nextFollowupDate == Today`.
- Save the results to a `DashboardCache` collection.
- Set up `vercel.json` to trigger this route at 1:00 AM daily.

---
*This architecture ensures the app remains blazing fast, financially secure, and incredibly cheap to host. Happy Coding!*
