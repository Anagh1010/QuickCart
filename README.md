# QuickCart - Modern E-Commerce Platform

QuickCart is a full-stack, modern e-commerce platform built with **Next.js 15 (App Router)** and **React 19**. It features real-time data synchronization between Clerk authentication and MongoDB using Inngest background jobs, image hosting via Cloudinary, integrated Razorpay payments, and a dedicated seller dashboard.

## 🚀 Features

- **User Authentication**: Secure login and sign-up powered by Clerk.
- **Dynamic Product Discovery**: Browse and search products with high-quality images and detailed descriptions.
- **Shopping Cart**: Real-time cart management and seamless checkout flow.
- **Payments**: Integrated Razorpay payment gateway with support for both online payments and Cash on Delivery (COD).
- **Seller Dashboard**: Dedicated interface for sellers to add products, manage listings, and track orders.
- **Order Management**: Comprehensive tracking for both users and sellers, with real-time payment status.
- **Address Management**: Save and manage shipping addresses for faster checkout.
- **Background Processing**: Reliable user data synchronization using Inngest and Clerk webhooks.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop using Tailwind CSS.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Authentication**: [Clerk (@clerk/nextjs)](https://clerk.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **Image Hosting**: [Cloudinary](https://cloudinary.com/)
- **State Management**: React Context API
- **Notifications**: React Hot Toast

## 📋 Prerequisites

Before you begin, ensure you have the following accounts and credentials:
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and connection string
- [Clerk](https://clerk.com/) account for authentication keys
- [Razorpay](https://razorpay.com/) account for payment gateway keys (test mode available)
- [Cloudinary](https://cloudinary.com/) account for image storage keys
- [Inngest Cloud](https://www.inngest.com/) account (optional for local development, but recommended for production)

## ⚙️ Local Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd QuickCart
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (see `.env.example` for reference) and add the following:
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
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

5. **Run Inngest Dev Server (For Background Jobs)**
   In a separate terminal, run:
   ```bash
   npx inngest-cli@latest dev
   ```
   This allows you to test webhooks and background functions locally.

## 📂 Project Structure

```
app/
├── api/
│   ├── cart/           # Cart get & update endpoints
│   ├── order/
│   │   ├── create/     # Order creation (COD & Online)
│   │   ├── list/       # User order history
│   │   ├── seller-orders/  # Seller order management
│   │   └── verify/     # Razorpay payment verification
│   ├── product/        # Product CRUD endpoints
│   ├── user/           # User data & address endpoints
│   └── inngest/        # Inngest webhook handler
├── cart/               # Cart & checkout page
├── my-orders/          # User order history page
├── order-placed/       # Order confirmation page
├── seller/             # Seller dashboard & order management
└── product/            # Product detail page

components/             # Reusable UI components
models/                 # Mongoose schemas (User, Product, Order, Address)
config/                 # Database & Inngest configuration
context/                # Global state management (AppContext)
lib/                    # Utility functions & middleware
assets/                 # Static assets
```

## 💳 Payment Flow

QuickCart supports two payment methods:

- **Cash on Delivery (COD)**: Order is placed immediately, payment collected on delivery.
- **Online Payment (Razorpay)**: Secure payment via Razorpay checkout modal with server-side signature verification (HMAC-SHA256).

For testing online payments, use Razorpay's test card: `4111 1111 1111 1111` with any future expiry date and any CVV.

## 📜 Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
