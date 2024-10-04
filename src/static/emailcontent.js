const contactUsContent = (senderName, senderEmail, query, senderMobile) => {
  return (`
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello, admin</h2>
              <h1 style="color: #007bff;"> Name:${senderName}</h1>
              <p>Email of the user is ${senderEmail}</p>
              <p>Email of the user is ${senderMobile}</p>
              <p>message:</p>
              <p>${query}</p>
              <br>
              <p>Best regards,</p>
              <p>The unfazed Team</p>
          </div>
      `)
}
const otpContent = (otp) => {
  return (`
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello,</h2>
              <p>Thank you for using unfazed. Your OTP code is:</p>
              <h1 style="color: #007bff;">${otp}</h1>
              <p>This OTP code is valid for 5 minutes. Please do not share this code with anyone.</p>
              <p>If you did not request this OTP, please ignore this email.</p>
              <br>
              <p>Best regards,</p>
              <p>The unfazed Team</p>
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
            <p>The unfazed Team</p>
        </div>
    `);
};

const welcomeEmail = (name) => {
  return (
    `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #555;">Hi ${name},</h2>
        <p>Welcome to Unfazed! We're thrilled to have you on board. You&apos;ve just taken the first step towards prioritizing your mental well-being, and we’re here to support you every step of the way.</p>
        <p>At Unfazed, we believe in creating a safe, judgment-free space where you can explore, heal, and grow. Whether you're looking for therapy, personal development, or simply a space to unwind and reconnect, we've got you covered.</p>
        <h3 style="color: #444;">Here's what you can expect moving forward:</h3>
        <ul>
            <li><strong>Custom Therapy Sessions</strong> &ndash; Personalized to your unique needs.</li>
            <li><strong>Flexible Formats</strong> &ndash; Choose between audio, video, or chat based on your comfort.</li>
            <li><strong>Holistic Wellness</strong> &ndash; Access additional resources to enhance your mental health journey.</li>
        </ul>
        <p>If you&apos;re ready, you can <a href="[Insert link]" style="color: #0066cc; text-decoration: none;">book your first session here</a> and get started. Should you have any questions or need assistance, feel free to reach out. We're always here to help.</p>
        <p>Thank you for trusting Unfazed with your mental health. We&apos;re excited to be a part of your journey!</p>
        <br>
        <p style="color: #888;">Warm regards,</p>
        <p>Team Unfazed</p>
        <p><strong>Whatsapp:</strong> +91-6392-975-097</p>
        <p><strong>Email:</strong> <a href="mailto:bds.unfazed@gmail.com" style="color: #0066cc; text-decoration: none;">contact@unfazed.in</a></p>
        <p><strong>Website:</strong> <a href="http://www.unfazed.in" target="_blank" style="color: #0066cc; text-decoration: none;">www.unfazed.in</a></p>
    </div>`
  )
}
const passwordUpdatedEmail = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #333;">Password Updated Successfully</h2>

    <p style="font-size: 16px; color: #555;">Dear ${name},</p>

    <p style="font-size: 16px; color: #555;">
      We wanted to let you know that your password has been successfully updated.
    </p>

    <p style="font-size: 16px; color: #555;">
      If you did not make this change or if you believe an unauthorized person has accessed your account, please reset your password immediately or contact our support team.
    </p>

    <p style="font-size: 16px; color: #555;">Thank you for using our service!</p>

    <p style="font-size: 16px; color: #555; margin-top: 20px;">
      Best regards,<br>
      <p> Team<strong> Unfazed</strong></p><br>
      <a href="mailto:bds.unfazed@gmail.com" style="color: #1a73e8; text-decoration: none;">support@bds.unfazed@gmail.com</a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="font-size: 12px; color: #888;">
      If you have any questions or need further assistance, please feel free to reach out to our support team.
    </p>
  </div>
`;

const sessionBookingConfirmation = (name, therapist) => {
  return (
    `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    
    <div style="background-color: #007bff; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2>Your Therapy Session with Unfazed is Confirmed!</h2>
    </div>
    
    <div style="padding: 20px;">
      <p>Dear <strong>${name}</strong>,</p>
      <p>Congratulations on taking the first step towards a stronger, more fulfilling relationship! Your journey with Unfazed begins now, and we are thrilled to have you on board.</p>
      
      <p>Your one-to-one therapy session has been successfully booked.</p>
      
      <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Therapist:</strong>${therapist}</p>
      </div>
      
      <p>If you have any questions, feel free to reach out to us at contact@unfazed.in.</p>
      <p>We look forward to helping you on your journey!</p>
      
      <p>Warm regards,</p>
      <p>The Team Unfazed</p>
    </div>
    
  </div>
</div>`

  )
}

const courseEnrollmentConfirmation = (name, therapist) => {
  return (
    `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    
    <div style="background-color: #007bff; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2>Your Therapy Session with Unfazed is Confirmed!</h2>
    </div>
    
    <div style="padding: 20px;">
      <p>Dear <strong>${name}</strong>,</p>
      <p>Congratulations on taking the first step towards a stronger, more fulfilling relationship! Your journey with Unfazed begins now, and we are thrilled to have you on board.</p>
      
      <p>You successfully enrolled in the course.</p>
      
      <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Therapist:</strong>${therapist}</p>
      </div>
      
      <p>If you have any questions, feel free to reach out to us at support@unfazed.com.</p>
      <p>We look forward to helping you on your journey!</p>
      
      <p>Warm regards,</p>
      <p>The Unfazed Team</p>
    </div>
    
  </div>
</div>`

  )
}

export { contactUsContent, otpContent, loginCredentialEmail, welcomeEmail, passwordUpdatedEmail, sessionBookingConfirmation, courseEnrollmentConfirmation }