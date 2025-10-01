import mongoose from 'mongoose';

const systemStatusSchema = new mongoose.Schema({
  lockdownMode: {
    type: Boolean,
    default: false
  },
  lockdownMessage: {
    type: String,
    default: 'System is undergoing maintenance. Please try again later.'
  },
  componentStatuses: {
    authentication: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    mining: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    tasks: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    referrals: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    database: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    telegram: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' }
  },
  errorLogs: [{
    component: String,
    error: String,
    timestamp: { type: Date, default: Date.now },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('SystemStatus', systemStatusSchema);