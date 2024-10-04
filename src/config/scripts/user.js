import { User } from "../../models/userModel";

const user = [
  {
    id: "371",
    password:
      "pbkdf2_sha256$390000$iz0VWCIxjoNA1hpffDLp3n$WSFMTh2N5wSqkaHipks6wyFqkP2xiz/rautOLBJuT6s=",
    last_login: "2024-09-06 08:18:12.000000",
    is_superuser: "0",
    username: "pritpatel4595@gmail.com",
    first_name: "Prit",
    last_name: "Patel",
    email: "pritpatel4595@gmail.com",
    is_staff: "0",
    is_active: "1",
    date_joined: "2024-09-06 05:21:12.000000",
    is_doctor: "0",
    is_patient: "1",
    is_admin: "0",
    dob: "Thu May 04 1995",
    mobile: "+61 426 808 050",
    gender: "Male",
    email_verified: "0",
    is_stylist: "0",
    mobile_verified: "1",
  },
];

function convertDateString(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, "0");
  if (`${year}-${month}-${day}` === "NaN-NaN-NaN") return "";
  return `${year}-${month}-${day}`;
}
const filteredUsers = user.filter((user) => user.is_patient === "1");
const updatedUsers = filteredUsers.map((u) => ({
  mobile: u.mobile || null,
  password: u.password,
  firstName: u.first_name,
  lastName: u.last_name || u.first_name,
  email: u.email,
  isActive: u.is_active === "1",
  isMobileVerified: u.mobile_verified === "1",
  isEmailVerified: u.email_verified === "1",
  gender:
    u.gender && ["male", "female", "non-binary", "other"].includes(u.gender)
      ? u.gender.toLowerCase()
      : "other",
  dateOfBirth: u?.dob ? convertDateString(u.dob) : "",
  role: u.is_superuser === "1" ? "admin" : "user",
  createdAt: new Date(u.date_joined),
}));

const insertedUsers = await User.insertMany(updatedUsers);
