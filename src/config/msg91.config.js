import https from "https";
import dotenv from "dotenv";
dotenv.config();

const authKey = process.env.AUTH_KEY;
const templateId = process.env.TEMPLATE_ID;
const otpExpiry = 10;

function sendOtpMessage(mobile, otp) {
  return new Promise((resolve, reject) => {
    // Prepend country code to mobile number
    mobile = `91${mobile}`;
    console.log("Sending OTP to mobile:", mobile);

    const options = {
      method: "POST",
      hostname: "control.msg91.com",
      port: null,
      path: `/api/v5/otp?otp=${otp}&otp_expiry=${otpExpiry}&template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&realTimeResponse=1`,
      headers: {
        "Content-Type": "application/JSON",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300 && response.type === "success") {
            resolve(response);
          } else {
            console.error(
              `Failed to send OTP. Status Code: ${res.statusCode}, Response: ${JSON.stringify(response)}`
            );
            reject(
              new Error(
                `Request failed with status code ${res.statusCode}: ${response.message || 'OTP sending failed'}`
              )
            );
          }
        } catch (error) {
          console.error("Error parsing response:", error.message);
          reject(new Error("Failed to parse response"));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error.message);
      reject(error);
    });

    // Send the request
    req.write(JSON.stringify({ mobile }));
    req.end();
  });
}

export { sendOtpMessage };
