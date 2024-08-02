import { sendOtpEmail, verifyOTP} from "../resend/resend.js";



const sendEmailOtp = async (req, res) => {
    const { email } = req.body;

    try {
        await sendOtpEmail(email);
        res.status(200).send('OTP sent to email');
    } catch (error) {
        res.status(500).send('Error sending OTP');
    }
}

 const verifyEmailOtp = async (req, res) => {
    const { email, otp } = req.body;

    const isValid = await verifyOTP(email, otp);

    if (isValid) {
        res.status(200).send('OTP verified successfully');
    } else {
        res.status(400).send('Invalid OTP');
    }
};

export {sendEmailOtp,verifyEmailOtp}
