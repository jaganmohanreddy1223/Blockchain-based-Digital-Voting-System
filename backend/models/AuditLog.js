const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');

const auditSchema = new mongoose.Schema({
  txHash: { type: String, required: true, unique: true },
  blockNumber: { type: Number, required: true },
  candidateId: { type: Number, required: true },
  voterAddressAnonymous: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'confirmed' },
});

let MongooseAudit = null;
try {
  MongooseAudit = mongoose.model('AuditLog', auditSchema);
} catch (e) {
  MongooseAudit = mongoose.models.AuditLog;
}

const inMemoryAuditLogs = new Map();

const AuditRepository = {
  create: async (auditData) => {
    if (getIsConnected() && MongooseAudit) {
      return await MongooseAudit.create(auditData);
    }
    inMemoryAuditLogs.set(auditData.txHash, { ...auditData });
    return auditData;
  },

  findByTxHash: async (txHash) => {
    if (getIsConnected() && MongooseAudit) {
      return await MongooseAudit.findOne({ txHash });
    }
    return inMemoryAuditLogs.get(txHash) || null;
  },
};

module.exports = { MongooseAudit, AuditRepository };

