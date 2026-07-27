import { clerkClient } from '@clerk/nextjs/server';

/**
 * Returns true if the given userId has role === 'seller' or 'admin' in Clerk publicMetadata.
 * Returns false (never throws) for any invalid/missing userId.
 */
const authSeller = async (userId) => {
    if (!userId) return false
    try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const role = user.publicMetadata?.role
        return role === 'seller' || role === 'admin'
    } catch {
        return false
    }
}

export default authSeller;