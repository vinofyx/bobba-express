const apiResponse = require('../shared/utils/apiResponse');

/**
 * Middleware factory that validates req.body against a Joi schema.
 *
 * Usage:
 *   router.post('/', validate(mySchema), controller.create);
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    return apiResponse(res, 422, 'Validation failed.', { errors: details });
  }

  req.body = value; // replace with sanitised value
  next();
};

module.exports = validate;
