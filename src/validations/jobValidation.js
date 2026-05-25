const { check } = require('express-validator'); // import validation tool

// validation rules for creating a job
exports.createJobValidation = [
    // title must not be empty
    check('title', 'Title is required').not().isEmpty(),

    // description must not be empty
    check('description', 'Description is required').not().isEmpty(),

    // requirements must not be empty
    check('requirements', 'Requirements are required').not().isEmpty(),

    // location must not be empty
    check('location', 'Location is required').not().isEmpty(),

    // job type must not be empty
    check('jobType', 'Job Type is required').not().isEmpty(),
];