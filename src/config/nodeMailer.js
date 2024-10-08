import dotenv from "dotenv"
import nodemailer from "nodemailer";
dotenv.config();
// const transporter = nodemailer.createTransport({
//   host: process.env.WEBMAIL_HOST,
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.ADMIN_EMAIL,
//     pass: process.env.PASSWORD,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

const transporter = nodemailer.createTransport({
  service:"gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.PASSWORD,
  },
});

const mailOptions=(receiverEmail,subject,htmlContent)=>{
  const mailOptions ={
    from:{
      name: "unfazed",
      address:process.env.ADMIN_EMAIL
    },
    to:receiverEmail,
    subject:subject,
    html:htmlContent
  }
return(mailOptions)
}
export {transporter,mailOptions};
