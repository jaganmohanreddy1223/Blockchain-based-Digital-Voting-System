const { CandidateRepository } = require('../models/Candidate');

const candidateController = {
  /**
   * Get all candidates with optional constituency filter.
   * GET /api/v1/candidates?city=Hyderabad
   */
  getCandidates: async (req, res, next) => {
    try {
      const { city } = req.query;
      const filter = {};
      if (city && city !== 'all') {
        filter.city = city;
      }

      const candidates = await CandidateRepository.getAll(filter);
      return res.status(200).json({
        success: true,
        count: candidates.length,
        data: candidates,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single candidate by ID.
   * GET /api/v1/candidates/:id
   */
  getCandidateById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const candidate = await CandidateRepository.getById(id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: `Candidate with ID ${id} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: candidate,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = candidateController;

