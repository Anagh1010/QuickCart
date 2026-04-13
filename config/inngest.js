import { Inngest } from "inngest";
import mongoose from "mongoose";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";

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

// Inngest Function to create user's order in database
export const createUserOrder = inngest.createFunction(
    {
        id:'create-user-order',
        batchEvents: {
            maxSize: 5,
            timeout: '5s'
        },
        trigger: {event: 'order/created'}
    },
    async ({events}) => {
        
        const orders = events.map((event)=> {
            const items = event.data.items.map(item => ({
                product: new mongoose.Types.ObjectId(item.product),
                quantity: item.quantity
            }));
            
            return {
                userId: event.data.userId,
                items: items,
                amount: event.data.amount,
                address: new mongoose.Types.ObjectId(event.data.address),
                date: event.data.date,
                status: event.data.status || 'Order Placed'
            }
        })

        try {
            await connectDB()
            console.log('Saving orders:', JSON.stringify(orders, null, 2));
            const result = await Order.insertMany(orders)
            console.log('Orders saved successfully:', result.length);
            return { success: true, processed: result.length };
        } catch (error) {
            console.error('Error saving orders to database:', error);
            throw error;
        }

    }
)
