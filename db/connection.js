import { configDotenv } from "dotenv";
import mongoose from "mongoose";


const connectDB = async () => {

    try {

        await mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}}`)
        console.log("DB connected");
    }
    catch (err) {
        console.log(err);

    }
}
export default connectDB;
