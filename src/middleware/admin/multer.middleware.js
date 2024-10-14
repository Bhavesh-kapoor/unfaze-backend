import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import ApiError from "../../utils/ApiError.js";

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
const getEmailPrefix = (email) => {
  if (email && email.includes("@")) return email.split("@")[0];
  else return email;
};
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
    case "blogImageUrl":
      return "src/images/blogs";
    case "userAvatar":
      return "src/images/users";
    case "userAvatarCorp":
      return "src/images/corpUsers";
    case "chatFile":
      return "src/images/chatFiles";
    default:
      return "src/images/other";
  }
};

// Function to remove existing file by fieldname and filename for blogImageUrl
const removeExistingFile = (folder, fieldname, req) => {
  if (fieldname === "chatFile" || fieldname === "userAvatarCorp") {
    return;
  }
  try {
    const files = fs.readdirSync(folder);
    for (const file of files) {
      if (file.includes(fieldname)) {
        if (fieldname === "blogImageUrl") {
          const titlePath = req.body?.title
            .toLowerCase()
            .split(" ")
            .slice(0, 3)
            .join("-");
          const isBlogImage = file.includes(titlePath);
          if (!isBlogImage) continue;
        }
        const filePath = path.join(folder, file);
        fs.unlinkSync(filePath);
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
    const emailPrefix = getEmailPrefix(req.body.email || req.user.email);
    const folder = getFolder(file.fieldname, emailPrefix);

    try {
      createFolder(folder);
      removeExistingFile(folder, file.fieldname, req);
      cb(null, folder);
    } catch (error) {
      cb(new Error("Failed to create directory"), folder);
    }
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (file.fieldname === "blogImageUrl") {
      const createPath = req.body?.title
        .toLowerCase()
        .split(" ")
        .slice(0, 3)
        .join("-");
      const uniqueName = `${Date.now()}-${file.fieldname}${createPath}${ext}`;
      return cb(null, uniqueName);
    }
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|webp|png|pdf/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) cb(null, true);
  else cb(new ApiError(400, "", "Only JPG, WEBP, PNG are allowed"));
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  const filePath = req.file.path;
  const emailPrefix = getEmailPrefix(req.body.email || req.user.email);
  const folder = getFolder(req.file.fieldname, emailPrefix);
  createFolder(folder);

  const compressedFilePath = path.join(
    folder,
    `compressed-${req.file.filename}`
  );

  try {
    await sharp(filePath)
      .resize(800) // Resize to width 800px
      .jpeg({ quality: 80 }) // Compress JPEG with 80% quality
      .toFile(compressedFilePath);

    setTimeout(async () => {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error("Error deleting original file:", err);
      }
    }, 1000);

    // Update the file path to the compressed image
    req.file.path = compressedFilePath;
    req.file.filename = `compressed-${req.file.filename}`;

    next();
  } catch (error) {
    console.error("Error compressing image:", error);
    next(new ApiError(500, "Error compressing image"));
  }
};

export { upload, compressImage };
