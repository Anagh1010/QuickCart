import connectDB from "@/config/db"
import Address from "@/models/Address"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getAuditRequestContext, logAudit } from '@/lib/audit'

export async function POST(request) {
    try {
        
        const { userId } = getAuth(request)
        const {address} = await request.json()

        await connectDB()
        const newAddress = await Address.create({...address,userId})

        await logAudit('address.created', 'address', userId, newAddress._id.toString(), {}, {
            resourceLabel: 'Saved address', request: getAuditRequestContext(request),
            changes: { after: { saved: true }, fields: ['saved'] }
        })

        return NextResponse.json({ success: true, message: "Address added successfully", newAddress })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
