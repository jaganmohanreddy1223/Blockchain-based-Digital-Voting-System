const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');

const scheduleSchema = new mongoose.Schema({
  phase: { type: String, required: true },
  gazetteNotification: { type: String, required: true },
  lastDateNominations: { type: String, required: true },
  scrutinyWithdrawal: { type: String, required: true },
  pollingDate: { type: String, required: true },
  pollingHours: { type: String, default: '07:00 - 18:00' },
  countingDate: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
});

let MongooseSchedule = null;
try {
  MongooseSchedule = mongoose.model('ElectionSchedule', scheduleSchema);
} catch (e) {
  MongooseSchedule = mongoose.models.ElectionSchedule;
}

const initialSchedule = [
  {
    phase: 'Phase I',
    gazetteNotification: 'March 20, 2026',
    lastDateNominations: 'March 27, 2026',
    scrutinyWithdrawal: 'March 30, 2026',
    pollingDate: 'April 19, 2026',
    pollingHours: '07:00 - 18:00',
    countingDate: 'June 04, 2026',
    status: 'active',
  },
  {
    phase: 'Phase II',
    gazetteNotification: 'March 28, 2026',
    lastDateNominations: 'April 04, 2026',
    scrutinyWithdrawal: 'April 08, 2026',
    pollingDate: 'April 26, 2026',
    pollingHours: '07:00 - 18:00',
    countingDate: 'June 04, 2026',
    status: 'upcoming',
  },
  {
    phase: 'Phase III',
    gazetteNotification: 'April 12, 2026',
    lastDateNominations: 'April 19, 2026',
    scrutinyWithdrawal: 'April 22, 2026',
    pollingDate: 'May 07, 2026',
    pollingHours: '07:00 - 18:00',
    countingDate: 'June 04, 2026',
    status: 'upcoming',
  },
  {
    phase: 'Phase IV',
    gazetteNotification: 'April 18, 2026',
    lastDateNominations: 'April 25, 2026',
    scrutinyWithdrawal: 'April 29, 2026',
    pollingDate: 'May 13, 2026',
    pollingHours: '07:00 - 18:00',
    countingDate: 'June 04, 2026',
    status: 'upcoming',
  },
];

const ScheduleRepository = {
  getSchedule: async () => {
    if (getIsConnected() && MongooseSchedule) {
      return await MongooseSchedule.find().sort({ phase: 1 });
    }
    return initialSchedule;
  },
};

module.exports = { MongooseSchedule, ScheduleRepository, initialSchedule };

