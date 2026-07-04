import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { runHealthChecks } from "@/lib/healthCheck";
import { logError } from "@/lib/logger";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "quickcart-next" });

// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk',
        trigger: { event: 'clerk/user.created' }
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl: image_url
        }
        await connectDB()
        await User.create(userData)
    }
)

// Inngest Function to update user data in database 
export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk',
        trigger: { event: 'clerk/user.updated' }
    },
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl: image_url
        }
        await connectDB()
        await User.findByIdAndUpdate(id,userData)
    }
)

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk',
        trigger: { event: 'clerk/user.deleted' }
    },
    async ({event}) => {
        
        const {id } = event.data

        await connectDB()
        await User.findByIdAndDelete(id)
    }
)

// Inngest Function to check and rollback abandoned online payments after 10 minutes
export const checkAbandonedPayment = inngest.createFunction(
    {
        id: 'check-abandoned-payment',
        trigger: { event: 'order/created' }
    },
    async ({ event, step }) => {
        const { orderId } = event.data;

        // 1. Wait for 10 minutes
        await step.sleep('wait-for-checkout', '10m');

        await connectDB();
        const order = await Order.findById(orderId);

        // 2. If the order is still unpaid and is pending, mark it as cancelled and release stock
        if (order && !order.isPaid && order.paymentMethod === 'Online' && order.status === 'Order Placed') {
            order.status = 'Payment Cancelled';
            await order.save();

            // 3. Atomically restore stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            }
        }
    }
)

// Inngest Cron: health-check every 12 hours
export const scheduledHealthCheck = inngest.createFunction(
    {
        id: 'scheduled-health-check',
        trigger: { cron: '0 */12 * * *' }   // every 12 hours
    },
    async () => {
        // Ensure DB is live so mongoose readyState is accurate
        await connectDB()

        const results = await runHealthChecks()

        for (const [service, status] of Object.entries(results)) {
            if (!status.ok) {
                const category = service === 'mongo' ? 'database' : 'infra'
                await logError(
                    `/health/cron/${service}`,
                    new Error(status.error || `${service} unreachable (scheduled check)`),
                    '',
                    { latencyMs: status.latencyMs, detail: status.detail, triggeredBy: 'inngest-cron' },
                    'error',
                    category,
                    503
                )
            }
        }

        const degraded = Object.entries(results)
            .filter(([, s]) => !s.ok)
            .map(([name]) => name)

        return {
            checkedAt: new Date().toISOString(),
            healthy: degraded.length === 0,
            degraded
        }
    }
)


