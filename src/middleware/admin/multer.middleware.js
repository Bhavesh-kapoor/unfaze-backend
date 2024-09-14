import fs from "fs";
import path from "path";
import multer from "multer";
import ApiError from "../../utils/ApiError.js";

// Function to create folder if it doesn't exist
const createFolder = (folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Error creating directory ${folderPath}:`, error);
    throw new Error(`Failed to create directory at ${folderPath}.`);
  }
};

// Function to get the part of the email before @
const getEmailPrefix = (email) => {
  if (email && email.includes("@")) return email.split("@")[0];
  else return email;
};

// Function to determine the storage folder
const getFolder = (fieldname, emailPrefix) => {
  const therapistFields = [
    "profileImage",
    "highschoolImg",
    "graduationImg",
    "intermediateImg",
    "postGraduationImg",
  ];
  if (therapistFields.includes(fieldname) && emailPrefix)
    return `src/images/therapists/${emailPrefix}`;

  switch (fieldname) {
    case "blog":
      return "src/images/blogs";
    case "userAvatar":
      return "src/images/users";
    default:
      return "src/images/other";
  }
};

// Function to remove existing file by fieldname
const removeExistingFile = (folder, fieldname) => {
  try {
    const files = fs.readdirSync(folder);
    for (const file of files) {
      if (file.includes(fieldname)) {
        const filePath = path.join(folder, file);
        fs.unlinkSync(filePath);
        console.log(`Removed old file: ${filePath}`);
        break;
      }
    }
  } catch (error) {
    console.error(`Error reading/removing file in folder ${folder}:`, error);
    throw new Error(`Failed to remove existing file in folder ${folder}.`);
  }
};

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const emailPrefix = getEmailPrefix(req.body.email || req.user.email); // Fallback to req.user.email if body email doesn't exist
    const folder = getFolder(file.fieldname, emailPrefix);

    try {
      createFolder(folder); // Ensure folder exists
      removeExistingFile(folder, file.fieldname); // Remove existing file with same fieldname
      cb(null, folder);
    } catch (error) {
      cb(new Error("Failed to create directory"), folder); // Handle any folder creation errors
    }
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`; // Generate unique file name
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|webp|png|pdf/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, "", "Only JPG, WEBP, PNG images, and PDFs are allowed")
    );
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
export default upload;
