const multer = require("multer");

// Configure multer storage to use memory storage for buffer handling
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(new Error("Only .png and .jpeg format allowed!"), false);
        }
    },
});

module.exports = upload;
