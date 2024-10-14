import mongoose from "mongoose";
import { Therapist } from "../models/therapistModel.js";


const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// const addTherapist = async () => {
//     try {
//         const therapist = new Therapist({
//             _id: "66e2871ee4b724345f152073",
//             firstName: "Jasneet",
//             lastName: "Kaur",
//             email: "jasneet1818@gmail.com",
//             password: "jassiisunfazed",
//             mobile: 7317586976,
//             gender: "female",
//             isEmailVerified: true,
//             isActive: true,
//             dateOfBirth: new Date("1999-08-28"),
//             specialization: ["66e424c4ab4c13ce64122b6f", "66e42596ab4c13ce64122b73", "66e425a4ab4c13ce64122b77"]
//         });
//         console.log(therapist)
//             // await therapist.save(); 
//         console.log("therapist created")
//     } catch (error) {
//         console.log(error)
//     }
// }
export { isValidObjectId }
