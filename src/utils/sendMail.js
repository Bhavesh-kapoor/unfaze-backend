import { mailOptions, transporter } from "../config/nodeMailer.js";
export const sendMail = (receiverEmail, subject, htmlContent) => {
    const options = mailOptions(receiverEmail, subject, htmlContent);
    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log("Error while sending email:", error);
        } else {
            console.log("Email sent successfully:", info.response);
        }
    });
}