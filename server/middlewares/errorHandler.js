export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, _next) {
  let message = error.message;
  if (error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Image size exceeds the 10 MB limit. Please upload a file under 10 MB.";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded. Maximum 5 images allowed.";
    } else {
      message = `Upload error: ${error.message}`;
    }
  } else if (error.code === 11000) {
    message = "A record with this value already exists";
  } else if (error.status >= 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected server error occurred";
  }

  const status = error.status || (error.name === "ValidationError" || error.name === "CastError" || error.name === "MulterError" ? 400 : error.code === 11000 ? 409 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({
    message,
    ...(error.name === "ValidationError" ? { errors: Object.values(error.errors).map(({ message: m }) => m) } : {}),
  });
}
