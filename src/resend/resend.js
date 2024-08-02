import otpGenerator from  "otp-generator";
import { OTP } from "../models/otpModel.js";
const RESEND_API_KEY = process.env.RESEND_API_KEY;


async function createAndStoreOTP(email) {
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false })
    const otpDoc = new OTP({ email, otp });
    await otpDoc.save();
    return otp;
}


async function sendOtpEmail(email) {
    const otp = await createAndStoreOTP(email);

    const data = {
        from: 'your-email@yourdomain.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`,
    };
    try {
        await axios.post('https://api.resend.com/email', data, {
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        throw new Error('Error sending OTP');
    }
}

async function verifyOTP(email, otp) {
    const otpDoc = await OTP.findOne({ email, otp });

    if (otpDoc) {
        await OTP.deleteOne({ _id: otpDoc._id }); // Remove the OTP after verification
        return true;
    }

    return false;
}

export {sendOtpEmail,verifyOTP}