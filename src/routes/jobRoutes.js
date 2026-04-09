const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authMiddleware, recruiterMiddleware } = require('../middleware/authMiddleware');

// Create job
router.post('/', authMiddleware, recruiterMiddleware, jobController.createJob);

// Recruiter jobs
router.get('/my-jobs', authMiddleware, recruiterMiddleware, jobController.getMyJobs);

// Public jobs
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.get('/:id/related', jobController.getRelatedJobs);

// ✅ UPDATE JOB (IMPORTANT FOR EDIT)
router.put('/:id', authMiddleware, recruiterMiddleware, jobController.updateJob);

// Close / reopen
router.patch('/:id/close', authMiddleware, recruiterMiddleware, jobController.closeJob);
router.patch('/:id/reopen', authMiddleware, recruiterMiddleware, jobController.reopenJob);

// Delete
router.delete('/:id', authMiddleware, recruiterMiddleware, jobController.deleteJob);

module.exports = router;