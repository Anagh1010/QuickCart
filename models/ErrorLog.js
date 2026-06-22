import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema({
    level: { type: String, enum: ['error', 'warn', 'info'], default: 'error' },
    message: { type: String, required: true },
    stack: { type: String, default: '' },
    route: { type: String, default: '' },
    userId: { type: String, default: '' },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
})

// Auto-expire logs older than 90 days
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

const ErrorLog = mongoose.models.errorlog || mongoose.model('errorlog', errorLogSchema)

export default ErrorLog
