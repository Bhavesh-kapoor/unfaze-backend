import multer from "multer";
import path from "path";
import ApiError from "../../utils/ApiError.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder;
    if (file.fieldname === "adharcard") {
      folder = "temp/uploads/adharcards";
    } else if (file.fieldname === "passport") {
      folder = "temp/uploads/passports";
    } else if (file.fieldname === "pancard") {
      folder = "temp/uploads/pancards";
    } else if (file.fieldname == "imageUrl") {
      folder = "temp/uploads/blogs";
    } else if (file.fieldname == "profileImage") {
      folder = "temp/uploads/profileImage";
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new ApiError(400, "", "Only images and PDFs are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

export default upload;
