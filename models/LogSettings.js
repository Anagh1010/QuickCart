import mongoose from 'mongoose'

/**
 * Singleton settings document for the logging system.
 * There will only ever be one document (key: 'default').
 */
const logSettingsSchema = new mongoose.Schema({
    _id:            { type: String,  default: 'default' },
    ttlDays:        { type: Number,  default: 90, min: 1, max: 365 },
    loggingEnabled: { type: Boolean, default: true },
})

const LogSettings = mongoose.models.logsettings || mongoose.model('logsettings', logSettingsSchema)

export default LogSettings
