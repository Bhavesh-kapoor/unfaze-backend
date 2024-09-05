const contactUsContent = (name, email, message) => {
    return (`
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello, admin</h2>
              <h1 style="color: #007bff;"> Name:${name}</h1>
              <p>Email of the user is ${email}</p>
              <p>message:</p>
              <p>${message}</p>
              <br>
              <p>Best regards,</p>
              <p>The Unfaze Team</p>
          </div>
      `)
}

const otpContent = (otp) => {
    return (`
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello,</h2>
              <p>Thank you for using Unfaze. Your OTP code is:</p>
              <h1 style="color: #007bff;">${otp}</h1>
              <p>This OTP code is valid for 5 minutes. Please do not share this code with anyone.</p>
              <p>If you did not request this OTP, please ignore this email.</p>
              <br>
              <p>Best regards,</p>
              <p>The Unfaze Team</p>
          </div>
      `
    )
}
const loginCredentialEmail = (username, tempPassword) => {
    return (`
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333;">Hello,</h2>
            <p>We are pleased to inform you that your account has been created successfully! Below are your login credentials:</p>
            <h3 style="color: #007bff;">Username: ${username}</h3>
            <h3 style="color: #007bff;">Temporary Password: ${tempPassword}</h3>
            <p>You can log in using the following link: <a href="[Login URL]" style="color: #007bff; text-decoration: none;">Login Here</a>.</p>
            <p><strong>Note:</strong> For security reasons, please change your password after your first login.</p>
            <p>If you did not request this account, please contact our support team immediately.</p>
            <br>
            <p>Best regards,</p>
            <p>The Unfaze Team</p>
        </div>
    `);
};

export { contactUsContent,otpContent,loginCredentialEmail }