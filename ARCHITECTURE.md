# QuickCart Architecture Documentation

## 1. System Overview
QuickCart is a modern e-commerce platform built on a serverless architecture using **Next.js 15 (App Router)**. It leverages **MongoDB** for data persistence, **Clerk** for authentication, **Inngest** for background job processing, **Cloudinary** for image hosting, and **Razorpay** for payment processing.

## 2. Technology Stack & Integration Points
- **Frontend Framework**: Next.js 15 & React 19. Provides Server Components, Client Components, and routing.
- **Styling**: Tailwind CSS 4.
- **State Management**: React Context API (`AppContext`) to globally manage cart state, user profile, and loaded products.
- **Database**: MongoDB Atlas with Mongoose ODM.
- **Authentication (Clerk)**: Handles user registration, login, and sessions. Emits webhooks on user profile changes.
- **Background Jobs (Inngest)**: Consumes Clerk webhooks to synchronize user profiles into MongoDB asynchronously. Also handles deferred tasks (e.g., reverting abandoned carts after 10 minutes).
- **Payments (Razorpay)**: Handles online checkout. Orders are verified via backend signature validation.
- **Media (Cloudinary)**: Product images uploaded by sellers are hosted on Cloudinary, serving optimized formats.

## 3. Data Models (MongoDB Schemas)

### User
- `_id`: String (Matches Clerk user ID)
- `name`: String
- `email`: String (Unique)
- `imageUrl`: String
- `cartItems`: Object (Key: Product ID, Value: Quantity)

### Product
- `userId`: String (Reference to User / Seller)
- `name`, `description`: String
- `price`, `offerPrice`: Number
- `image`: Array of Strings (Cloudinary URLs)
- `category`: String
- `date`: Number (Timestamp)
- `stock`: Number

### Address
- `userId`: String
- `fullName`, `phoneNumber`, `pincode`, `area`, `city`, `state`: String

### Order
- `userId`: String
- `items`: Array of `{ product: ObjectId, quantity: Number }`
- `amount`: Number
- `address`: ObjectId (Reference to Address)
- `status`: String (Default: 'Order Placed')
- `paymentMethod`: String (Default: 'COD')
- `isPaid`: Boolean (Default: false)
- `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`: String
- `couponCode`: String
- `discount`: Number
- `date`: Number (Timestamp)

### Review
- `productId`: ObjectId (Reference to Product)
- `userId`: String
- `userName`, `userImage`: String
- `rating`: Number (1-5)
- `comment`: String
- `isVerified`: Boolean
- `date`: Number (Timestamp)

### Coupon
- `code`: String (Unique, Uppercase)
- `discountType`: String ('flat' or 'percentage')
- `discountValue`: Number
- `minCartAmount`: Number
- `expiryDate`: Date
- `isActive`: Boolean

## 4. Key Workflows

### A. Authentication & User Sync
1. User logs in/signs up via Clerk UI on the frontend.
2. Clerk authenticates the user and generates a session.
3. Clerk fires a `user.created` or `user.updated` webhook.
4. Next.js API route (`/api/inngest`) receives the webhook.
5. Inngest queues the background job (`sync-user-from-clerk`).
6. Inngest worker executes the job and creates/updates the User document in MongoDB.

### B. Cart & Checkout Flow
1. User adds items to the cart. `AppContext` state is updated.
2. Frontend calls `/api/cart/update` to sync `cartItems` map to the User document in MongoDB.
3. User proceeds to checkout and selects a shipping Address (saved to MongoDB).
4. User selects payment method (COD or Online).

### C. Payment Processing
**Cash On Delivery (COD)**:
1. `POST /api/order/create` is called.
2. Order document created with `isPaid: false`, `status: 'Order Placed'`.
3. Cart is cleared.

**Online Payment (Razorpay)**:
1. `POST /api/order/create` generates a Razorpay Order ID.
2. Order document created with `isPaid: false`.
3. Inngest background event `order/created` is triggered. The worker sleeps for 10 minutes.
4. User completes payment via Razorpay checkout widget.
5. Frontend calls `POST /api/order/verify` with payment signature.
6. Backend validates signature. If valid, Order is marked `isPaid: true`. Cart is cleared.
7. **Timeout / Abandonment**: After 10 minutes, the Inngest worker wakes up. It checks the Order in MongoDB. If `isPaid` is still `false` and status is still `Order Placed`, the Order status is changed to `Payment Cancelled` and product stock is restored.

## 5. Directory Structure
- `/app`: Next.js 15 App Router pages and API routes (`/app/api`).
- `/components`: Reusable React components (Navbar, Product Cards, etc.).
- `/config`: Database connection (`db.js`) and Inngest client/functions configuration (`inngest.js`).
- `/context`: Global state management (`AppContext.jsx`).
- `/models`: Mongoose database schemas.
- `/lib`: Helper functions and backend middleware (e.g., `authSeller.js`).
- `/public` & `/assets`: Static assets, SVGs, placeholders.
