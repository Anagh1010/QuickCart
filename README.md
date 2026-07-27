# QuickCart - Modern E-Commerce Platform

QuickCart is a full-stack, modern e-commerce platform built with **Next.js 16 (App Router)** and **React 19**. It features real-time data synchronization between Clerk authentication and MongoDB using Inngest background jobs, image hosting via Cloudinary, integrated Razorpay payments, a dedicated seller dashboard, and a full-featured admin panel with error & audit logging.

## 🚀 Features

- **User Authentication**: Secure login and sign-up powered by Clerk.
- **Dynamic Product Discovery**: Browse and search all products (`/all-products`) with high-quality images and detailed descriptions.
- **Product Reviews**: Users can leave star ratings and comments on products; verified purchase badges supported.
- **Shopping Cart**: Real-time cart management and seamless checkout flow.
- **Coupon & Discounts**: Apply coupon codes at checkout for flat or percentage-based discounts.
- **Payments**: Integrated Razorpay payment gateway with support for both online payments and Cash on Delivery (COD).
- **Cart Abandonment Recovery**: Inngest background job automatically reverts unpaid online orders after 10 minutes and restores stock.
- **Seller Dashboard**: Dedicated interface for sellers to add products, manage listings, and track orders.
- **Order Management**: Comprehensive tracking for both users and sellers, with real-time payment status.
- **Address Management**: Save and manage shipping addresses for faster checkout.
- **Admin Panel**: Role-based admin dashboard (`/admin`) with sub-sections for users, sellers, audit logs, error logs, and log settings.
- **Error & Audit Logging**: Structured error logs and audit trail stored in MongoDB, viewable via the admin panel.
- **Background Processing**: Reliable user data synchronization and deferred tasks using Inngest and Clerk webhooks.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop using Tailwind CSS 4.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Authentication** | [Clerk (@clerk/nextjs)](https://clerk.com/) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| **Payments** | [Razorpay](https://razorpay.com/) |
| **Background Jobs** | [Inngest](https://www.inngest.com/) |
| **Image Hosting** | [Cloudinary](https://cloudinary.com/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **State Management** | React Context API |
| **Notifications** | React Hot Toast |

## 📋 Prerequisites

Before you begin, ensure you have the following:
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and connection string
- [Clerk](https://clerk.com/) account for authentication keys
- [Razorpay](https://razorpay.com/) account for payment gateway keys (test mode available)
- [Cloudinary](https://cloudinary.com/) account for image storage keys
- [Inngest Cloud](https://www.inngest.com/) account (optional for local dev, recommended for production)

## ⚙️ Local Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd quickcart
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Razorpay
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Inngest
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   INNGEST_EVENT_KEY=your_inngest_event_key

   # Application Settings
   NEXT_PUBLIC_CURRENCY=$
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Inngest Dev Server** *(required for background jobs & webhooks)*
   ```bash
   npx inngest-cli@latest dev
   ```

## 🔐 Admin Setup

The admin role is managed via Clerk Public Metadata — no hardcoded credentials.

1. Create a user in the [Clerk Dashboard](https://dashboard.clerk.com/) (e.g. `admin@quickcart.com`).
2. In **Clerk Dashboard → Users → [user] → Public Metadata**, set:
   ```json
   { "role": "admin" }
   ```
3. That user can now log in and will be redirected to `/admin/dashboard`.

## 📂 Project Structure

```
app/
├── api/
│   ├── admin/          # Admin-only API routes
│   ├── cart/           # Cart get & update endpoints
│   ├── coupon/         # Coupon validation & management
│   ├── inngest/        # Inngest webhook handler
│   ├── log/            # Error & audit log endpoints
│   ├── order/
│   │   ├── create/     # Order creation (COD & Online)
│   │   ├── list/       # User order history
│   │   ├── seller-orders/ # Seller order management
│   │   └── verify/     # Razorpay payment verification
│   ├── product/        # Product CRUD endpoints
│   ├── review/         # Product review endpoints
│   ├── seller/         # Seller-specific endpoints
│   └── user/           # User data & address endpoints
├── admin/              # Admin panel (role-gated)
│   ├── dashboard/      # Overview stats
│   ├── users/          # User management
│   ├── sellers/        # Seller management
│   ├── logs/           # Error log viewer
│   └── audit/          # Audit trail viewer
├── all-products/       # Full product catalog page
├── cart/               # Cart & checkout page
├── add-address/        # Add shipping address page
├── my-orders/          # User order history page
├── order-placed/       # Order confirmation page
├── seller/             # Seller dashboard & order management
└── product/            # Product detail page

components/             # Reusable UI components
models/                 # Mongoose schemas
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Address.js
│   ├── Review.js
│   ├── Coupon.js
│   ├── AuditLog.js
│   ├── ErrorLog.js
│   └── LogSettings.js
config/                 # Database & Inngest configuration
context/                # Global state (AppContext)
lib/                    # Utility functions & middleware
assets/                 # Static assets
```

## 💳 Payment Flow

QuickCart supports two payment methods:

- **Cash on Delivery (COD)**: Order is placed immediately; payment collected on delivery.
- **Online Payment (Razorpay)**: Secure payment via Razorpay checkout modal with server-side HMAC-SHA256 signature verification. If payment is not completed within **10 minutes**, the Inngest worker marks the order as `Payment Cancelled` and restores product stock.

For testing online payments, use Razorpay's test card: `4111 1111 1111 1111` with any future expiry date and any CVV.

## 🎟️ Coupon System

- Supports **flat** (fixed amount off) and **percentage** discount types.
- Minimum cart amount threshold per coupon.
- Expiry date and active/inactive toggle managed via the admin panel.

## 📊 Logging & Audit Trail

- **Error Logs**: Application errors are captured and stored in MongoDB (`ErrorLog`) and viewable at `/admin/logs`.
- **Audit Logs**: User and admin actions are recorded in `AuditLog` and viewable at `/admin/audit`.
- **Log Settings**: Configurable logging behaviour managed via `LogSettings`.

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server with Turbopack |
| `npm run build` | Builds the application for production |
| `npm start` | Starts the production server |
| `npm run lint` | Runs ESLint for code quality checks |
