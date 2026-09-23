import multer from "multer";

// Keep the uploaded file temporarily in server memory.
// Multer will make its content available as req.file.buffer.
const storage = multer.memoryStorage();

// Allow only PDF and plain-text files.
const fileFilter = (req, file, callback) => {
  const allowedTypes = ["application/pdf", "text/plain"];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Only PDF and TXT files are allowed");
    error.statusCode = 400;

    return callback(error);
  }

  // Accept the uploaded file.
  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,

  // Accept only one file with a maximum size of 5 MB.
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});
