const contactUsContent = (senderName, senderEmail, query, senderMobile) => {
  return (`
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello, admin</h2>
              <h1 style="color: #007bff;"> Name:${senderName}</h1>
              <p>Email of the user is ${senderEmail}</p>
              <p>Mobile of the user is ${senderMobile}</p>
              <p>message:</p>
              <p>${query}</p>
              <br>
              <p>Best regards,</p>
              <p>Team Unfazed</p>
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
              <p>Team unfazed</p>
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
            <p>Team unfazed</p>
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
        <p><strong>Email:</strong> <a href="mailto:contact@unfazed.in" style="color: #0066cc; text-decoration: none;">contact@unfazed.in</a></p>
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
      <a href="mailto:contact@unfazed.in" style="color: #1a73e8; text-decoration: none;">support@-contact@unfazed.in</a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="font-size: 12px; color: #888;">
      If you have any questions or need further assistance, please feel free to reach out to our support team.
    </p>
  </div>
`;

const sessionBookingConfirmation = (name, therapist, sessionDate, sessionUrl) => {
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
       <div style="margin: 10px 0;">
        <h2>Session Details:</h2>
        <div><strong>Date:</strong> ${sessionDate}</div>
         <p><a href="${sessionUrl}">Session Link: ${sessionUrl}</a></p>
        </div>
      
      <p>If you have any questions, feel free to reach out to us at contact@unfazed.in.</p>
      <p>We look forward to helping you on your journey!</p>
      
      <p>Warm regards,</p>
      <p>Team Unfazed</p>
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
      <p>Team Unfazed</p>
    </div>
    
  </div>
</div>`

  )
}

function createPwdEmailContent(name, link) {
  return `
    <div class="email-container" style="background-color: #ffffff; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #dddddd; border-radius: 8px;">
        <h1 style="color: #333333;">Welcome to Unfazed!</h1>
        <p>Dear ${name},</p>
        <p>We’re excited to have you with us. To start using your account, please create your password by clicking the button below:</p>
        <a href="${link}" style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px;">Create Password</a>
        <p>For your security, this link will expire in 1 hour.</p>
        <p>If you didn’t request this email, you can safely ignore it. If you need any help, feel free to contact us.</p>
        <div class="footer" style="margin-top: 30px; font-size: 12px; color: #888888;">
            <p>Thank you,<br>Team Unfazed</p>
            <p>If you’re having trouble clicking the button, copy and paste this URL into your browser:<br><a href="${link}" style="color: #007bff;">${link}</a></p>
           <p><strong>Whatsapp:</strong> +91-6392-975-097</p>
           <p><strong>Email:</strong> <a href="mailto:contact@unfazed.in" style="color: #0066cc; text-decoration: none;">contact@unfazed.in</a></p>
            <p><strong>Website:</strong> <a href="http://www.unfazed.in" target="_blank" style="color: #0066cc; text-decoration: none;">www.unfazed.in</a></p>
        </div>
    </div>
  `;
}

function userSessionReminderEmailTemplate(userName, therapistName, sessionDate) {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px; margin: 0;">
          <div style="background-color: #4CAF50; color: white; padding: 10px; border-radius: 5px 5px 0 0; text-align: center;">
              <h1>Reminder: Your Session is Starting Soon!</h1>
          </div>
          <div style="padding: 20px; background: #fff; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
              <div>
                  <p>Dear ${userName},</p>
                  <p>This is a friendly reminder that your session with <strong>${therapistName}</strong> is scheduled to start in <strong>30 minutes</strong>.</p>
              </div>
              <div style="margin: 10px 0;">
                  <h2>Session Details:</h2>
                  <div><strong>Date:</strong> ${sessionDate}</div>
              </div>
              <div>
                  <p>Please ensure you are prepared and available for your session. If you have any questions or need to reschedule, feel free to reach out.</p>
                   <p><strong>Email:</strong> <a href="mailto:contact@unfazed.in" style="color: #0066cc; text-decoration: none;">contact@unfazed.in</a></p>

              </div>
              <p>Warm regards,</p>
              <p>Team Unfazed</p>
          </div>
         
      </div>
  `;
}

function therapistSessionReminderEmailTemplate(therapistName, userName, sessionDate) {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px; margin: 0;">
          <div style="background-color: #4CAF50; color: white; padding: 10px; border-radius: 5px 5px 0 0; text-align: center;">
              <h1>Reminder: Your Session is Starting Soon!</h1>
          </div>
          <div style="padding: 20px; background: #fff; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
              <div>
                  <p>Dear ${therapistName},</p>
                  <p>This is a friendly reminder that you have a session with <strong>${userName}</strong> scheduled to start in <strong>30 minutes</strong>.</p>
              </div>
              <div style="margin: 10px 0;">
                  <h2>Session Details:</h2>
                  <div><strong>Date:</strong> ${sessionDate}</div>
              </div>
              <div>
                  <p>Please ensure you are prepared and available for the session. If you have any questions or need to reschedule, feel free to reach out.</p>
                   <p><strong>Email:</strong> <a href="mailto:contact@unfazed.in" style="color: #0066cc; text-decoration: none;">contact@unfazed.in</a></p>
              </div>
              <p>Warm regards,</p>
              <p>Team Unfazed</p>
          </div>
      </div>
  `;
}

const reqForMoreSession = (companyName, adminName, email, mobile) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="text-align: center; color: #4CAF50; font-size: 24px; margin-bottom: 20px;">Request for Additional Therapy Sessions for Employees</h2>
      
      <p style="margin-bottom: 15px;">Dear Admin,</p>

      <p style="margin-bottom: 15px;">I hope this email finds you well. I am writing on behalf of <strong>${companyName}</strong> to request additional therapy sessions for our employees. We have found the existing sessions to be very beneficial, and we would like to continue providing this support to our team as part of our employee wellness program.</p>

      <p style="margin-bottom: 15px;">Could you please provide details on how we can schedule more sessions and any associated requirements for booking? Additionally, any other necessary information regarding the process would be appreciated.</p>

      <p style="margin-bottom: 15px;">We value this service and are keen to ensure our employees continue to benefit from it. Thank you for your assistance, and I look forward to your response.</p>

      <h3 style="margin-bottom: 10px; font-size: 18px;">Company and Contact Details:</h3>
      <ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px;">
        <li style="margin-bottom: 8px;"><strong>Company Name:</strong> ${companyName}</li>
        <li style="margin-bottom: 8px;"><strong>Admin Name:</strong> ${adminName}</li>
        <li style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</li>
        <li><strong>Contact Number:</strong> ${mobile}</li>
      </ul>

      <p style="margin-top: 20px;">Best regards,<br/>
      <strong>${adminName}</strong><br/>
      ${companyName}</p>
    </div>
  `;
}
const newSessionAlert = (therapistName, clientName, sessionDate, sessionUrl) => {
  return (
    `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: #007bff; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2>New Session Booking Alert!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear <strong>${therapistName}</strong>,</p>
          <p>You have a new therapy session booked with a client.</p>
          
          <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><a href="${sessionUrl}">Session Link: ${sessionUrl}</a></p>
          </div>
          
          <p>If you have any questions or need to reschedule, please contact us at <a href="mailto:contact@unfazed.in">contact@unfazed.in</a>.</p>
          <p>Thank you for your commitment to supporting your clients!</p>
          
          <p>Best regards,</p>
          <p>Team Unfazed</p>
        </div>
        
      </div>
    </div>`
  );
}


export { contactUsContent, otpContent, loginCredentialEmail, welcomeEmail, passwordUpdatedEmail, sessionBookingConfirmation, courseEnrollmentConfirmation, createPwdEmailContent, userSessionReminderEmailTemplate, therapistSessionReminderEmailTemplate, reqForMoreSession, newSessionAlert }