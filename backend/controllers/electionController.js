const { ScheduleRepository } = require('../models/ElectionSchedule');

const electionController = {
  /**
   * Get official General Parliamentary Election 2026 dates & phases.
   * GET /api/v1/elections/schedule
   */
  getSchedule: async (req, res, next) => {
    try {
      const schedule = await ScheduleRepository.getSchedule();
      return res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = electionController;

