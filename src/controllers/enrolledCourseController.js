import { EnrolledCourse } from "../models/enrolledCourse.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import { Course } from "../models/courseModel.js";
import { sendNotification } from "./notificationController.js";
import {transporter} from "../config/nodeMailer.js";
import { otpContent } from "../static/emailcontent.js";


const getEnrolledCourseList = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;

  // Pagination parameters with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const enrolledList = await EnrolledCourse.find({ user_id })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'course_id',
      populate: {
        path: 'therapist_id',
        model: 'Therapist',
        select: "firstName lastName email mobile"
      }
    });

  if (!enrolledList || enrolledList.length === 0) {
    throw new ApiError(404, "You're not enrolled in any course!");
  }

  const totalDocuments = await EnrolledCourse.countDocuments({ user_id });

  return res.status(200).json(new ApiResponse(200, {
    enrolledList,
    totalPages: Math.ceil(totalDocuments / limit),
    currentPage: page,
    totalDocuments
  }, "List fetched successfully"));
});


const handlePaymentSuccess = asyncHandler(async (req, res) => {
  const { paymentDetails, course_id } = req;
  const user = await User.findById(req.user?._id);
  const course = await Course.findOne({ _id: course_id }).populate(
    "therapist_id"
  );
  console.log("course_____________", course)
  if (paymentDetails.code === "PAYMENT_SUCCESS") {
    const newEnrollment = new EnrolledCourse({
      course_id: course_id,
      user_id: req.user?._id,
      payment_status: paymentDetails.code,
      transaction_id: paymentDetails.transactionId,
      amount: paymentDetails.amount,
      remaining_sessions: course.session_count,
      merchantTransactionId: paymentDetails.data.merchantTransactionId,
      transaction_id: paymentDetails.data.transactionId,
      amount: paymentDetails.data.amount,
      remaining_sessions: course.session_count,
      status: paymentDetails.data.state,
      statusCode: paymentDetails.data.responseCode,
      paymentMode: paymentDetails.data.paymentInstrument.type,
      active: true,
    });
    await newEnrollment.save();
    // send in app notification
    const receiverId = course.therapist_id;
    const receiverType = "Therapist";
    const message = `${user.firstName} ${user.lastName} is successfully enrolled in the course`;
    const payload = {
      courseId: course_id,
      user_id: user._id,
      email: user.email,
      mobile: user.mobile,
    };
    sendNotification(receiverId, receiverType, message, payload)
      .then((notification) => {
        console.log("Notification sent:", notification);
      })
      .catch((err) => {
        console.error("Error sending notification:", err);
      });

    // send mail notifications
    const mailOptions = {
      from: `Unfaze "<${process.env.GMAIL}>"`,
      to: course.therapist_id.email,
      subject: "Course Enrollment Confirmation",
      // text: 'You have successfully enrolled in the course: Introduction to Psychology', // Plain text body
      html: `<p>${user.firstName} ${user.lastName} is successfully enrolled in the course</p>`, // HTML body
    };
     transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error while sending email:", error);
      }
      console.log("Email sent successfully:", info.response);
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, newEnrollment, "Enrolled  in course successfully")
      );
  } else {
    res.status(400).json(new ApiError(400, "Something went wrong!!!"));
  }
});
export { getEnrolledCourseList, handlePaymentSuccess };
