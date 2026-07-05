import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
    action:     { type: String, required: true },   // e.g. 'product.listed', 'order.created'
    resource:   { type: String, required: true },   // e.g. 'product', 'order', 'cart'
    resourceId: { type: String, default: '' },      // specific item ID where relevant
    userId:     { type: String, default: '' },      // '' for anonymous
    metadata:   { type: Object, default: {} },
    createdAt:  { type: Date,   default: Date.now }
})

// Auto-expire after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

// Compound index used by hasRecentAudit() — covers action + userId + date range efficiently
auditLogSchema.index({ action: 1, userId: 1, createdAt: -1 })

// Indexes for aggregation queries
auditLogSchema.index({ resource: 1, createdAt: -1 })

const AuditLog = mongoose.models.auditlog || mongoose.model('auditlog', auditLogSchema)

export default AuditLog
