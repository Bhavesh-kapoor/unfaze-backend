import { EnrolledCourse } from "../models/enrolledCourse.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import { Course } from "../models/courseModel.js";
import { sendNotification } from "./notificationController.js";


const getEnrolledCourseList = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;
  const enrolledList = await EnrolledCourse.find({ user_id });
  if (!enrolledList) {
    throw new ApiError(404, "You'r not enrolled in any course!");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, enrolledList, "list fetched successfully"));
});

const handlePaymentSuccess = asyncHandler(async (req, res) => {
  const { paymentDetails, course_id } = req;
  const user = await  User.findById(req.user?._id)
  console.log("user-------",user)
  const course = await Course.findOne({ _id: course_id });
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

    const receiverId = course.therapist_id
    const receiverType = "Therapist";
    const message =
      `${user.firstName } ${user.lastName} is successfully enrolled in the course`;
    const payload = {
      courseId: course_id,
      user_id:user._id,
      email:user.email,
      mobile:user.mobile
    };
   sendNotification(receiverId, receiverType, message, payload)
    .then(notification => {
        console.log('Notification sent:', notification);
    })
    .catch(err => {
        console.error('Error sending notification:', err);
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
