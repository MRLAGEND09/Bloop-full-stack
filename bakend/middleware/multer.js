import multer from "multer";
import path from 'path'

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/')
    },
    filename: function(req, file, callback) {
        const ext = path.extname(file.originalname || '') || '.png'
        const baseName = path.basename(file.originalname || 'avatar', ext)
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .slice(0, 40) || 'avatar'
        callback(null, `${Date.now()}-${baseName}${ext}`)
    }
});

const upload = multer({ storage });

export default upload