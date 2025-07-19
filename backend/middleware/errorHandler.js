module.exports = (err, req, res, next) => {
  console.error("❌", err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "Something went wrong on the server.",
  });
};
