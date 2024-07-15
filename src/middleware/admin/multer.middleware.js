import multer from "multer";
import path from 'path';


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder;
        if (file.fieldname === 'adharcard') {
            folder = 'temp/uploads/adharcards';
        } else if (file.fieldname === 'passport') {
            folder = 'temp/uploads/passports';
        } else if (file.fieldname === 'pancard') {
            folder = 'temp/uploads/pancards';
        }
        cb(null, folder)
    },
    // filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix ); // Include original filename for better tracking
    // }

    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, uniqueName);
    }
    ,
    
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new ApiError(400, "", "Only images and PDFs are allowed"));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

export default upload;