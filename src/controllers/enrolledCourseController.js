import { EnrolledCourse } from "../models/enrolledCourse.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import { Course } from "../models/courseModel.js";
import { sendNotification } from "./notificationController.js";
import { transporter } from "../config/nodeMailer.js";
import { otpContent } from "../static/emailcontent.js";

const getEnrolledCourseList = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;

  // Pagination parameters with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await EnrolledCourse.find({ user_id })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "course_id",
      populate: {
        path: "therapist_id",
        model: "Therapist",
        select: "firstName lastName email mobile",
      },
    });

  if (!result || result.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "You're not enrolled in any course!"));
  }

  const totalDocuments = await EnrolledCourse.countDocuments({ user_id });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        result,
        pagination: {
          totalPages: Math.ceil(totalDocuments / limit),
          currentPage: page,
          totalItems: totalDocuments,
          itemsPerPage: parseInt(limit),
        },
      },
      "List fetched successfully"
    )
  );
});

const handlePhonepayPayment = asyncHandler(async (req, res) => {
  try {
    const { paymentDetails, course_id } = req;
    const user = req.user;

    const course = await Course.findOne({ _id: course_id }).populate(
      "therapist_id"
    );
    if (!course) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Course not found."));
    }
    // Determine the payment status based on PhonePe's responseCode
    let order_status;
    switch (paymentDetails.data.responseCode) {
      case "PENDING":
        order_status = "pending";
        break;
      case "SUCCESS":
        order_status = "successful";
        break;
      case "FAILED":
        order_status = "failed";
        break;
      case "REFUNDED":
        order_status = "refunded";
        break;
      default:
        order_status = "pending"; // Default for unknown status
    }
    let transaction = await EnrolledCourse.findOne({
      transaction_id: paymentDetails.data.transactionId,
    });

    if (transaction) {
      if (transaction.payment_status !== order_status) {
        transaction.payment_status = order_status;
        transaction.payment_details = paymentDetails.data;

        if (order_status === "successful") {
          transaction.is_active = true;
          if (!transaction.remaining_sessions) {
            transaction.remaining_sessions = course.session_count;
          }
        }
        await transaction.save();

        //send notifications/emails based on the updated status
        if (order_status === "successful") {
          // Send in-app notification
          const receiverId = course.therapist_id;
          const receiverType = "Therapist";
          const message = `${user.firstName} ${user.lastName} has successfully completed payment and is enrolled in the course.`;
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

          // Send email notification
          const mailOptions = {
            from: `Unfaze <${process.env.GMAIL}>`,
            to: course.therapist_id.email,
            subject: "Course Enrollment Confirmation",
            html: `<p>${user.firstName} ${user.lastName} has successfully enrolled in the course.</p>`,
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return console.log("Error while sending email:", error);
            }
            console.log("Email sent successfully:", info.response);
          });
        }

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              transaction,
              "Payment status updated successfully."
            )
          );
      } else {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              transaction,
              "Payment already verified and up-to-date."
            )
          );
      }
    }

    // No existing transaction found; create a new enrollment
    const newEnrollment = new EnrolledCourse({
      course_id: course_id,
      user_id: user._id,
      amount: paymentDetails.data.amount,
      payment_details: paymentDetails.data,
      payment_status: order_status,
      transaction_id: paymentDetails.data.transactionId,
      remaining_sessions: course.session_count,
      is_active: order_status === "successful", // Activate only if payment is successful
    });

    await newEnrollment.save();
    if (order_status === "successful") {
      // Send in-app notification
      const receiverId = course.therapist_id;
      const receiverType = "Therapist";
      const message = `${user.firstName} ${user.lastName} has successfully enrolled in the course.`;
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

      // Send email notification
      const mailOptions = {
        from: `Unfaze <${process.env.GMAIL}>`,
        to: course.therapist_id.email,
        subject: "Course Enrollment Confirmation",
        html: `<p>${user.firstName} ${user.lastName} has successfully enrolled in the course.</p>`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log("Error while sending email:", error);
        }
        console.log("Email sent successfully:", info.response);
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newEnrollment,
          "Enrollment processed successfully."
        )
      );
  } catch (error) {
    console.error("Error in handlePhonepayPayment:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error."));
  }
});

const handleCashfreePayment = asyncHandler(async (req, res) => {
  try {
    const { paymentDetails, course_id } = req;
    const user = req.user;
    const course = await Course.findOne({ _id: course_id }).populate(
      "therapist_id"
    );
    if (!course) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Course not found."));
    }
    let order_status;
    switch (paymentDetails.order_status) {
      case "ACTIVE":
        order_status = "pending";
        break;
      case "PAID":
        order_status = "successful";
        break;
      case "EXPIRED":
        order_status = "expired";
        break;
      case "FAILED":
        order_status = "failed";
        break;
      case "CANCELLED":
        order_status = "cancelled";
        break;
      default:
        order_status = "pending";
    }

    // Check if a transaction with the given order_id already exists
    let transaction = await EnrolledCourse.findOne({
      transaction_id: paymentDetails.order_id,
    });

    if (transaction) {
      if (transaction.payment_status !== order_status) {
        transaction.payment_status = order_status;
        transaction.payment_details = paymentDetails;

        if (order_status === "successful") {
          transaction.is_active = true;
          if (!transaction.remaining_sessions) {
            transaction.remaining_sessions = course.session_count;
          }
        }

        await transaction.save();

        if (order_status === "successful") {
          // Send in-app notification
          const receiverId = course.therapist_id;
          const receiverType = "Therapist";
          const message = `${user.firstName} ${user.lastName} has successfully completed payment and is enrolled in the course.`;
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

          // Send email notification
          const mailOptions = {
            from: `Unfaze <${process.env.GMAIL}>`,
            to: course.therapist_id.email,
            subject: "Course Enrollment Confirmation",
            html: `<p>${user.firstName} ${user.lastName} has successfully enrolled in the course.</p>`,
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return console.log("Error while sending email:", error);
            }
            console.log("Email sent successfully:", info.response);
          });
        }

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              transaction,
              "Payment status updated successfully."
            )
          );
      } else {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              transaction,
              "Payment already verified and up-to-date."
            )
          );
      }
    }

    // No existing transaction found; create a new enrollment
    const newEnrollment = new EnrolledCourse({
      course_id: course_id,
      user_id: user._id,
      amount: paymentDetails.order_amount,
      payment_details: paymentDetails,
      payment_status: order_status,
      transaction_id: paymentDetails.order_id,
      remaining_sessions: course.session_count,
      is_active: order_status === "successful", // Activate only if payment is successful
    });

    await newEnrollment.save();

    // Send notifications and emails only if the payment is successful
    if (order_status === "successful") {
      // Send in-app notification
      const receiverId = course.therapist_id;
      const receiverType = "Therapist";
      const message = `${user.firstName} ${user.lastName} has successfully enrolled in the course.`;
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

      // Send email notification
      const mailOptions = {
        from: `Unfaze <${process.env.GMAIL}>`,
        to: course.therapist_id.email,
        subject: "Course Enrollment Confirmation",
        html: `<p>${user.firstName} ${user.lastName} has successfully enrolled in the course.</p>`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log("Error while sending email:", error);
        }
        console.log("Email sent successfully:", info.response);
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newEnrollment,
          "Enrollment processed successfully."
        )
      );
  } catch (error) {
    console.error("Error in handleCashfreePayment:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error."));
  }
});

export { getEnrolledCourseList, handlePhonepayPayment, handleCashfreePayment };
