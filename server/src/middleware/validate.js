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
    // Also hint what the body should look like if it was empty
    const isEmpty = !req.body || Object.keys(req.body).length === 0;
    return apiResponse(res, 422, 'Validation failed.', {
      errors: details,
      ...(isEmpty && {
        hint: 'Request body is empty. In Thunder Client / Postman: click the Body tab → select JSON → paste your JSON data.',
      }),
    });
  }

  req.body = value; // replace with sanitised value
  next();
};

module.exports = validate;
