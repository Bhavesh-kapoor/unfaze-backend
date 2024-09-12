// import { Therapist } from "../../models/therapistModel";

// const user = [
//   {
//     id: "371",
//     password:
//       "pbkdf2_sha256$390000$iz0VWCIxjoNA1hpffDLp3n$WSFMTh2N5wSqkaHipks6wyFqkP2xiz/rautOLBJuT6s=",
//     last_login: "2024-09-06 08:18:12.000000",
//     is_superuser: "0",
//     username: "pritpatel4595@gmail.com",
//     first_name: "Prit",
//     last_name: "Patel",
//     email: "pritpatel4595@gmail.com",
//     is_staff: "0",
//     is_active: "1",
//     date_joined: "2024-09-06 05:21:12.000000",
//     is_doctor: "0",
//     is_patient: "1",
//     is_admin: "0",
//     dob: "Thu May 04 1995",
//     mobile: "+61 426 808 050",
//     gender: "Male",
//     email_verified: "0",
//     is_stylist: "0",
//     mobile_verified: "1",
//   },
// ];

// function convertDateString(dateStr) {
//   const date = new Date(dateStr);
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
//   const day = String(date.getDate()).padStart(2, "0");
//   if (`${year}-${month}-${day}` === "NaN-NaN-NaN") return "";
//   return `${year}-${month}-${day}`;
// }
// const filteredUsers = user.filter((user) => user.is_doctor === "1");

// const data = filteredUsers.map((u) => ({
//   firstName: u.first_name || "", // required field
//   lastName: u.last_name || u.first_name || "", // required field
//   mobile: u.mobile || "", // unique, required
//   email: u.email || "", // unique, required
//   isEmailVerified: u.email_verified === "1", // default: false
//   isMobileVerified: u.mobile_verified === "1", // default: false
//   gender:
//     u.gender &&
//     ["male", "female", "non-binary", "other"].includes(u.gender.toLowerCase())
//       ? u.gender.toLowerCase()
//       : "other", // required enum, defaults to "other"
//   password: u.password || "", // required, but should be hashed when saved
//   adharNumber: u.adharNumber || "", // required, unique
//   panNumber: u.panNumber || "", // required, unique
//   dateOfBirth: u?.dob ? convertDateString(u.dob) : "", // required field
//   experience: u.experience || "", // optional
//   bio: u.bio || "", // optional
//   profileImageUrl: u.profileImage || "", // optional, defaults to ""
//   role: "therapist", // defaults to "therapist"
//   isActive: false, // default: false
//   usdPrice: u.usdPrice || 0, // required
//   inrPrice: u.inrPrice || 0, // optional, defaults to 0
//   serviceChargeUsd: u.serviceChargeUsd || 0, // required
//   serviceChargeInr: u.serviceChargeInr || 0, // required
//   educationDetails: {
//     highSchool: {
//       courseName: u.highSchool?.courseName || "",
//       institutionName: u.highSchool?.institutionName || "",
//       completionYear: u.highSchool?.completionYear || null,
//       certificateImageUrl: u.highSchool?.certificateImageUrl || "",
//     },
//     intermediate: {
//       courseName: u.intermediate?.courseName || "",
//       institutionName: u.intermediate?.institutionName || "",
//       completionYear: u.intermediate?.completionYear || null,
//       certificateImageUrl: u.intermediate?.certificateImageUrl || "",
//     },
//     graduation: {
//       courseName: u.graduation?.courseName || "",
//       institutionName: u.graduation?.institutionName || "",
//       completionYear: u.graduation?.completionYear || null,
//       certificateImageUrl: u.graduation?.certificateImageUrl || "",
//     },
//     postGraduation: {
//       courseName: u.postGraduation?.courseName || "",
//       institutionName: u.postGraduation?.institutionName || "",
//       completionYear: u.postGraduation?.completionYear || null,
//       certificateImageUrl: u.postGraduation?.certificateImageUrl || "",
//     },
//   },
//   addressDetails: {
//     country: u.address?.country || "",
//     state: u.address?.state || "",
//     city: u.address?.city || "",
//     pincode: u.address?.pincode || "",
//     addressLine1: u.address?.addressLine1 || "",
//     addressLine2: u.address?.addressLine2 || "",
//     landmark: u.address?.landmark || "",
//     latitude: u.address?.latitude || null,
//     longitude: u.address?.longitude || null,
//   },
//   socialMedia: {
//     linkedin: u.social?.linkedin || "",
//     instagram: u.social?.instagram || "",
//     facebook: u.social?.facebook || "",
//     twitter: u.social?.twitter || "",
//     youtube: u.social?.youtube || "",
//   },
//   bankDetails: {
//     bankName: u.bank?.bankName || "",
//     ifscCode: u.bank?.ifscCode || "",
//     accountHolder: u.bank?.accountHolder || "",
//     accountNumber: u.bank?.accountNumber || "",
//     branchName: u.bank?.branchName || "",
//     accountType: u.bank?.accountType || "",
//   },
//   specialization: u.specialization || [], // reference array for specializations
// }));

// const insertedUsers = await Therapist.insertMany(data);
