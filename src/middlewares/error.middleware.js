
const errorHandler = (err, req, res, next) => {
  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  if (statusCode >= 500) {
    console.error("Unhandled request error", { name: err.name, code: err.original?.code });
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
};

export default errorHandler;
