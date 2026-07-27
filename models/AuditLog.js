import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
    eventVersion: { type: Number, default: 1 },
    action:       { type: String, required: true }, // e.g. 'product.updated', 'order.created'
    category:     { type: String, enum: ['audit', 'security', 'analytics'], default: 'audit' },
    outcome:      { type: String, enum: ['success', 'denied', 'failed'], default: 'success' },
    resource:     { type: String, required: true },
    resourceId:   { type: String, default: '' },
    resourceLabel:{ type: String, default: '' },
    userId:       { type: String, default: '' }, // retained for backwards-compatible filtering
    actor: {
        id:   { type: String, default: '' },
        role: { type: String, default: '' },
        type: { type: String, enum: ['user', 'system', 'anonymous'], default: 'user' },
    },
    request: {
        id:        { type: String, default: '' },
        route:     { type: String, default: '' },
        method:    { type: String, default: '' },
        ip:        { type: String, default: '' },
        userAgent: { type: String, default: '' },
    },
    changes: {
        before: { type: Object, default: {} },
        after:  { type: Object, default: {} },
        fields: { type: [String], default: [] },
    },
    metadata:   { type: Object, default: {} },
    createdAt:  { type: Date, default: Date.now }
}, { minimize: false })

// Auto-expire after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

// Compound index used by hasRecentAudit() — covers action + userId + date range efficiently
auditLogSchema.index({ action: 1, userId: 1, createdAt: -1 })

// Primary feed query patterns.
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, createdAt: -1 })
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 })
auditLogSchema.index({ outcome: 1, createdAt: -1 })

// Indexes for aggregation queries
auditLogSchema.index({ resource: 1, createdAt: -1 })

const AuditLog = mongoose.models.auditlog || mongoose.model('auditlog', auditLogSchema)

export default AuditLog
