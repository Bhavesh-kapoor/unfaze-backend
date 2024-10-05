import { User } from "../../models/userModel.js";
import fs from "fs"
// import bcrypt from "bcryptjs";
//  import { userData } from "./data.js";

// // const user = [
// //   {
// //     id: "371",
// //     password:
// //       "pbkdf2_sha256$390000$iz0VWCIxjoNA1hpffDLp3n$WSFMTh2N5wSqkaHipks6wyFqkP2xiz/rautOLBJuT6s=",
// //     last_login: "2024-09-06 08:18:12.000000",
// //     is_superuser: "0",
// //     username: "pritpatel4595@gmail.com",
// //     first_name: "Prit",
// //     last_name: "Patel",
// //     email: "pritpatel4595@gmail.com",
// //     is_staff: "0",
// //     is_active: "1",
// //     date_joined: "2024-09-06 05:21:12.000000",
// //     is_doctor: "0",
// //     is_patient: "1",
// //     is_admin: "0",
// //     dob: "Thu May 04 1995",
// //     mobile: "+61 426 808 050",
// //     gender: "Male",
// //     email_verified: "0",
// //     is_stylist: "0",
// //     mobile_verified: "1",
// //   },
// // ];

// // 
// function convertDateString(dateStr) {
//     const date = new Date(dateStr);
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
//     const day = String(date.getDate()).padStart(2, "0");
//     if (`${year}-${month}-${day}` === "NaN-NaN-NaN") return "";
//     return `${year}-${month}-${day}`;
// }

// // Filter and map users
// const filteredUsers = userData.filter((user) => user.is_patient === 1);
// console.log(filteredUsers)
// const updatedUsers = filteredUsers.map((u) => ({
//     mobile: u.mobile || null,
//     password: "unfazed123",
//     firstName: u.first_name,
//     lastName: u.last_name || u.first_name,
//     email: u.email,
//     isActive: u.is_active === 1,
//     isMobileVerified: u.mobile_verified === 1,
//     isEmailVerified: u.email_verified === 1,
//     gender:
//         u.gender && ["male", "female", "non-binary", "other"].includes(u.gender.toLocaleLowerCase())
//             ? u.gender.toLowerCase()
//             : "other",
//     dateOfBirth: u?.dob ? convertDateString(u.dob) : "",
//     role: u.is_superuser === 1 ? "admin" : "user",
//     createdAt: new Date(u.date_joined),
// }));
// // Insert users into the database, without overwriting existing ones
// const insertOrUpdateUser = async (user) => {
//     try {
//         // Check if the user exists
//         const existingUser = await User.findOne({ email: user.email });

//         // If the user does not exist or if the password has changed, hash the password
//         if (!existingUser && user.password) {
//             user.password = await bcrypt.hash(user.password, 10);
//         }

//         // Perform the upsert operation
//         await User.updateOne(
//             { email: user.email },
//             { $setOnInsert: user },
//             { upsert: true }
//         );

//         console.log("User inserted or updated successfully.");
//     } catch (error) {
//         console.error("Error inserting/updating user:", error);
//     }
// };

// updatedUsers.forEach((user) => insertOrUpdateUser(user));

export const updateUserPasswords = async (newPassword) => {
    const email = []
    try {
        // Fetch users with role 'user'
        const users = await User.find({ role: "user" });
        console.log(users)

        // If no users found
        if (users.length === 0) {
            console.log("No users found with role 'user'.");
            return;
        }
        // Update each user's password
        for (const user of users) {
            // user.password = newPassword; // Set the new password directly
            // user.gender = user.gender?.toLowerCase()
            // await user.save(); // Save the updated user document, triggering the pre-save middleware
            email.push(user.email)
        }

        console.log(`${users.length} users' passwords updated successfully.`);
        const emailsJson = JSON.stringify(email, null, 2); // Pretty print with 2 spaces

        // Write the JSON string to a new file
        fs.writeFileSync("useremails.json", emailsJson, "utf-8");
    } catch (error) {
        console.error("Error updating passwords:", error);
    }
};