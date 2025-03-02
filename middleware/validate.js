const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

const moodValidation = [
  body('mood').isString().notEmpty().withMessage('Mood is required'),
  body('feeling').optional().isString(),
  body('notes').optional().isString()
];

const journalValidation = [
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('content').isString().notEmpty().withMessage('Content is required'),
  body('tags').optional().isString().withMessage('Tags must be a string')
];

const usernameValidation = [
  param('username').isString().notEmpty().withMessage('Username is required')
];

const dateValidation = [
  param('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100')
];

module.exports = {
  validate,
  moodValidation,
  journalValidation,
  usernameValidation,
  dateValidation,
  paginationValidation
};