import https from "https"
import dotenv from "dotenv"
dotenv.config()
const authKey = process.env.AUTH_KEY;
const templateId = process.env.TEMPLET_ID;
const otpExpiry = 10
console.log(authKey)
function sendOtpMessage(mobile, otp) {
    const options = {
        method: "POST",
        hostname: "control.msg91.com",
        port: null,
        path: `/api/v5/otp?otp=${otp}&otp_expiry=${otpExpiry}&template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&realTimeResponse=1`,
        headers: {
            "Content-Type": "application/JSON",
        },
    };
    const req = https.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    // Send the request
    req.write(JSON.stringify({ mobile: mobile }));
    req.end();
}
export { sendOtpMessage }

// const mobileNumber = "918595529873";
// const otp = "123456";
// const authKey = "429733A1fedwxloiX66de98c3P1";
// const templateId = "66de9618d6fc0546ba4383b2";
//const otpExpiry = 15;

// sendOtpMessage(mobileNumber, otp);