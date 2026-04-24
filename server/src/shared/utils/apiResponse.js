/**
 * Standardized API response utility
 * Usage: apiResponse(res, statusCode, message, data)
 */
const apiResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: statusCode < 400,
    message,
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

module.exports = apiResponse;
