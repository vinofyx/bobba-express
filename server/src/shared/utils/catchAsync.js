/**
 * Async error wrapper - catches errors from async functions and passes them to next()
 * Usage: const asyncHandler = catchAsync(async (req, res, next) => { ... });
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
