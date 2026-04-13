# QuickCart - Modern E-Commerce Platform

QuickCart is a full-stack, modern e-commerce platform built with **Next.js 15 (App Router)** and **React 19**. It features real-time data synchronization between Clerk authentication and MongoDB using Inngest background jobs, image hosting via Cloudinary, and a dedicated seller dashboard.

## 🚀 Features

- **User Authentication**: Secure login and sign-up powered by Clerk.
- **Dynamic Product Discovery**: Browse and search products with high-quality images and detailed descriptions.
- **Shopping Cart**: Real-time cart management and seamless checkout flow.
- **Seller Dashboard**: Dedicated interface for sellers to add products, manage listings, and track orders.
- **Order Management**: Comprehensive tracking for both users and sellers.
- **Address Management**: Save and manage shipping addresses for faster checkout.
- **Background Processing**: Reliable user data synchronization using Inngest and Clerk webhooks.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop using Tailwind CSS.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/)
- **Authentication**: [Clerk (@clerk/nextjs)](https://clerk.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **Image Hosting**: [Cloudinary](https://cloudinary.com/)
- **State Management**: React Context API
- **Notifications**: React Hot Toast

## 📋 Prerequisites

Before you begin, ensure you have the following accounts and credentials:
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and connection string
- [Clerk](https://clerk.com/) account for authentication keys
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
   Create a `.env.local` file in the root directory and add the following:
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

- `app/`: Next.js App Router routes and API endpoints.
- `components/`: Reusable UI components for user and seller interfaces.
- `models/`: Mongoose schemas for User, Product, Order, and Address.
- `config/`: Configuration for database and Inngest.
- `context/`: Global state management via `AppContext`.
- `lib/`: Utility functions and middleware.
- `assets/`: Static assets and product data placeholders.

## 📜 Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and for educational purposes.
