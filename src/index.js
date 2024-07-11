import app from "./app.js";
import connectDB from "../db/connection.js";


// connect db here
try {
    await connectDB().then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running at ${process.env.PORT}`)
        });

    });

} catch (err) {
    throw err;
}









