import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const authSeller = async (userId) => {
    try {

        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const role = user.publicMetadata?.role
        return role === 'seller' || role === 'admin'
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

export default authSeller;