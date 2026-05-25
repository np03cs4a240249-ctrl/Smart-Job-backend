// import required packages
const express = require('express');
const router = express.Router();
const savedJobController = require('../controllers/savedJobController');
const { authMiddleware } = require('../middleware/authMiddleware');

/* -------------------- SAVE JOB -------------------- */
// save a job (only logged-in user)
router.post('/', authMiddleware, savedJobController.saveJob);

/* -------------------- UNSAVE JOB -------------------- */
// remove saved job
router.delete('/:jobId', authMiddleware, savedJobController.unsaveJob);

/* -------------------- GET SAVED JOBS -------------------- */
// get all saved jobs of user
router.get('/', authMiddleware, savedJobController.getSavedJobs);

/* -------------------- CHECK SAVED STATUS -------------------- */
// check if a job is already saved
router.get('/check/:jobId', authMiddleware, savedJobController.checkIfSaved);

// export router
module.exports = router;