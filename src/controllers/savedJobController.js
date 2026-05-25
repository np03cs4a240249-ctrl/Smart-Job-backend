const { SavedJob, Job, User } = require('../models');

/* SAVE JOB */
exports.saveJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const userId = req.user.id;

        /* CHECK IF JOB ALREADY SAVED */
        const existing = await SavedJob.findOne({
            where: { userId, jobId }
        });

        if (existing) {
            return res.status(400).json({ message: 'Job already saved' });
        }

        /* SAVE JOB */
        await SavedJob.create({ userId, jobId });
        res.json({ message: 'Job saved successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/* UNSAVE JOB */
exports.unsaveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;

        /* FIND SAVED JOB */
        const savedJob = await SavedJob.findOne({
            where: { userId, jobId }
        });

        if (!savedJob) {
            return res.status(404).json({ message: 'Saved job not found' });
        }

        /* DELETE SAVED JOB */
        await savedJob.destroy();
        res.json({ message: 'Job unsaved successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/* GET ALL SAVED JOBS */
exports.getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.id;

        const savedJobs = await SavedJob.findAll({
            where: { userId },
            include: [
                {
                    model: Job,
                    as: 'job',
                    include: [
                        {
                            model: User,
                            as: 'recruiter',
                            attributes: ['name', 'companyName', 'companyWebsite', 'aboutCompany']
                        }
                    ]
                }
            ],
            order: [['savedAt', 'DESC']]
        });

        res.json(savedJobs);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/* CHECK IF JOB IS SAVED */
exports.checkIfSaved = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;

        /* CHECK RECORD EXISTS */
        const savedJob = await SavedJob.findOne({
            where: { userId, jobId }
        });

        res.json({ isSaved: !!savedJob });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};