// import multer from "multer";
// import path from "path";
// import ApiError from "../../utils/ApiError.js";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     let folder;
//     if (file.fieldname === "adharcard") {
//       folder = "images/uploads/adharcards";
//     } else if (file.fieldname === "passport") {
//       folder = "images/uploads/passports";
//     } else if (file.fieldname === "pancard") {
//       folder = "images/uploads/pancards";
//     } else if (file.fieldname == "imageUrl") {
//       folder = "images/uploads/blogs";
//     } else if (file.fieldname == "profileImage") {
//       folder = "images/uploads/profileImage";
//     }
//     cb(null, folder);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
//     cb(null, uniqueName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|pdf/;
//   const extname = allowedTypes.test(
//     path.extname(file.originalname).toLowerCase()
//   );
//   const mimetype = allowedTypes.test(file.mimetype);
//   if (extname && mimetype) {
//     return cb(null, true);
//   } else {
//     cb(new ApiError(400, "", "Only images and PDFs are allowed"));
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
// });

// export default upload;
import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../../utils/ApiError.js";

const createFolder = (folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Directory created successfully: ${folderPath}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${folderPath}:`, error);
    throw new Error(`Failed to create directory at ${folderPath}.`);
  }
};

// Function to get the part of the email before @
const getEmailPrefix = (email) => {

  if (email && email.includes('@')) {
    return email.split("@")[0];

  } else {
    return email;
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    console.log("Received file field: ", file.fieldname);
    const emailPrefix = getEmailPrefix(req.body.email);
    let folder;
    if (file.fieldname === "highschoolImg") {
      folder = `src/images/uploads/therapists/${emailPrefix}/highschool`;
    } else if (file.fieldname === "intermediateImg") {
      folder = `src/images/uploads/therapists/${emailPrefix}/intermediate`;
    } else if (file.fieldname === "graduationImg") {
      folder = `src/images/uploads/therapists/${emailPrefix}/graduation`;
    } else if (file.fieldname === "postGraduationImgs") {
      console.log(emailPrefix, 'emailPrefix')

      folder = `src/images/uploads/therapists/${emailPrefix}/postGraduation`;
      console.log(folder, emailPrefix, 'hey bro testing');
    } else if (file.fieldname === "blog") {
      folder = "src/images/uploads/blogs";
    } else {
      folder = `src/images/uploads/therapists/test/other`;
    }

    // Create folder if it doesn't exist
    createFolder(folder);
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
