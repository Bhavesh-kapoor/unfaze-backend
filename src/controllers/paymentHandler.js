import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendNotification } from "./notificationController.js";
import { transporter, mailOptions } from "../config/nodeMailer.js";
import { Therapist } from "../models/therapistModel.js";
import { Session } from "../models/sessionsModel.js";
import { Slot } from "../models/slotModal.js";
import { sessionBookingConfirmation } from "../static/emailcontent.js";
import { Coupon } from "../models/couponModel.js";
import { Course } from "../models/courseModel.js";
import { User } from "../models/userModel.js";
import { EnrolledCourse } from "../models/enrolledCourseModel.js";
import { courseEnrollmentConfirmation } from "../static/emailcontent.js";
// function convertUTCtoIST(utcDate) {
//   const date = new Date(utcDate);
//   const istDateTime = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
//   const [istDate, istTime] = istDateTime.split(', ');
//   return { date: istDate, time: istTime };
// }
export const sendNotificationsAndEmails = async (user, therapist, htmlContent, message, subject) => {
  const receiverId = therapist._id;
  const payload = {
    therapist_id: therapist._id,
    user_id: user._id,
    email: user.email,
    mobile: user.mobile,
  };
  try {
    const notification = await sendNotification(
      receiverId,
      "Therapist",
      message,
      payload
    );
  } catch (err) {
    console.error("Error sending notification:", err);
  }
  const options = mailOptions(user.email, subject, htmlContent)
  //   from: `Unfazed <${process.env.GMAIL}>`,
  //   to: user.email,
  //   subject: subject,
  //   html: htmlContent
  // };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log("Error while sending email:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });

};

// const getEnrolledCourseList = asyncHandler(async (req, res) => {
//   const user_id = req.user?._id;

//   // Pagination parameters with default values
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   const result = await EnrolledCourse.find({ user_id })
//     .skip(skip)
//     .limit(limit)
//     .populate({
//       path: "course_id",
//       populate: {
//         path: "therapist_id",
//         model: "Therapist",
//         select: "firstName lastName email mobile",
//       },
//     });

//   if (!result || result.length === 0) {
//     return res
//       .status(200)
//       .json(new ApiResponse(200, [], "You're not enrolled in any course!"));
//   }

//   const totalDocuments = await EnrolledCourse.countDocuments({ user_id });

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         result,
//         pagination: {
//           totalPages: Math.ceil(totalDocuments / limit),
//           currentPage: page,
//           totalItems: totalDocuments,
//           itemsPerPage: parseInt(limit),
//         },
//       },
//       "List fetched successfully"
//     )
//   );
// });
const mapPaymentStatus = (responseCode) => {
  const statusMap = {
    PENDING: "pending",
    SUCCESS: "successful",
    FAILED: "failed",
    REFUNDED: "refunded",
    CANCELLED: "cancelled",
    ACTIVE: "pending",
    PAID: "successful",
    FAILED: "failed",
    REFUNDED: "refunded",
    CANCELLED: "cancelled",
  };
  return statusMap[responseCode] || "pending";
};
const handlePhonepayPayment = asyncHandler(async (req, res) => {
  // const mapPaymentStatus = (responseCode) => {
  //   const statusMap = {
  //     PENDING: "pending",
  //     SUCCESS: "successful",
  //     FAILED: "failed",
  //     REFUNDED: "refunded",
  //     CANCELLED: "cancelled",
  //   };
  //   return statusMap[responseCode] || "pending";
  // };
  try {
    const { paymentDetails, transaction } = req;
    const user = req.user;
    const therapist = await Therapist.findById(transaction.therapist_id);

    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }

    const order_status = mapPaymentStatus(paymentDetails?.data?.responseCode);
    transaction.payment_details = paymentDetails;
    paymentDetails.payment_status = order_status;
    transaction.payment_status = order_status;
    transaction.save();
    if (order_status !== "successful") {
      await Slot.updateOne({
        therapist_id: transaction.therapist_id,
        "timeslots._id": transaction.slotId,
      }, {
        $set: {
          "timeslots.$.isBooked": false,
        },
      })
    }
    if (order_status === "successful") {
      const existingSession = await Session.findOne({
        transaction_id: transaction._id,
      });
      if (existingSession) {
        return res
          .status(400)
          .json(
            new ApiResponse(200, existingSession, "session already booked")
          );
      }
      const session = new Session({
        transaction_id: transaction._id,
        therapist_id: transaction.therapist_id,
        user_id: transaction.user_id,
        category: transaction.category,
        start_time: transaction.start_time,
        end_time: transaction.end_time,
      });
      let channelName = session._id.toString().slice(-10)
      channelName = `session_${channelName}`;
      session.channelName = channelName;
      await session.save();
      // const { date, time } = convertUTCtoIST(transaction.start_time);
      if (transaction?.couponCode) {
        const coupon = await Coupon.findOne({ code: transaction.couponCode });
        if (coupon) {
          coupon.usedCount += 1;
          if (coupon.usedCount == coupon.usageLimit) {
            coupon.isActive = false;
          }
          await coupon.save();
        }
      }
      // const monetization = await TherapistPay.findOne({
      //   $and: [
      //     { therapistId: transaction.therapist_id },
      //     { specializationId: transaction.category }
      //   ]
      // });
      // monetization.count = monetization.count + 1;
      // await monetization.save();
      const message = `${user.firstName} ${user.lastName} has successfully booked a session.`;
      const subject = "Session Booking Confirmation";
      const htmlContent = sessionBookingConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
      await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
      res
        .status(201)
        .json(new ApiResponse(201, session, "Session booked successfully"));
    } else {
      res.status(200).json(new ApiResponse(200, null, paymentDetails.message));
    }
  } catch (error) {
    console.error("Error in session booking:", error);
    res.status(500).json(new ApiError(500, error, "something went wrong!"));
  }
});
const handleCashfreePayment = asyncHandler(async (req, res) => {
  const mapPaymentStatus = (responseCode) => {
    const statusMap = {
      ACTIVE: "pending",
      PAID: "successful",
      FAILED: "failed",
      REFUNDED: "refunded",
      CANCELLED: "cancelled",
    };
    return statusMap[responseCode] || "pending";
  };
  try {
    const { paymentDetails, transaction } = req;
    // console.log("paymentDetails", paymentDetails);
    // console.log("paymentDetails", paymentDetails);
    const user = req.user;
    const therapist = await Therapist.findById(transaction.therapist_id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }
    const order_status = mapPaymentStatus(paymentDetails.order_status);
    transaction.payment_details = paymentDetails.data;
    paymentDetails.payment_status = order_status;
    transaction.payment_status = order_status;

    transaction.save();
    if (order_status !== "successful") {
      await Slot.updateOne({
        therapist_id: transaction.therapist_id,
        "timeslots._id": transaction.slotId,
      }, {
        $set: {
          "timeslots.$.isBooked": false,
        },
      })
    }
    if (order_status === "successful") {
      const existingSession = await Session.findOne({
        transaction_id: transaction._id,
      });
      if (existingSession) {
        return res
          .status(200)
          .send(
            new ApiResponse(200, existingSession, "session already booked")
          );
      }
      const session = new Session({
        transaction_id: transaction._id,
        therapist_id: transaction.therapist_id,
        user_id: user._id,
        category: transaction.category,
        start_time: transaction.start_time,
        end_time: transaction.end_time,
      });

      let channelName = session._id.toString().slice(-10)
      channelName = `session_${channelName}`;
      session.channelName = channelName;
      await session.save();
      if (transaction?.couponCode) {
        const coupon = await Coupon.findOne({ code: transaction.couponCode });
        if (coupon) {
          coupon.usedCount += 1;
          if (coupon.usedCount == coupon.usageLimit) {
            coupon.isActive = false;
          }
          await coupon.save();
        }
      }
      // const monetization = await TherapistPay.findOne({
      //   $and: [
      //     { therapistId: transaction.therapist_id },
      //     { specializationId: transaction.category }
      //   ]
      // });
      // monetization.count = monetization.count + 1;
      // await monetization.save();

      const message = `${user.firstName} ${user.lastName} has successfully booked a session.`;
      const subject = "Session Booking Confirmation";
      const htmlContent = sessionBookingConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
      await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
      return res
        .status(201)
        .json(new ApiResponse(201, session, "Session booked successfully"));
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, null, paymentDetails.message));
    }
  } catch (error) {
    console.error("Error in handleCashfreePayment:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error."));
  }
});


const manualPaymentValidator = asyncHandler(async (req, res) => {
  const { paymentDetails, transaction } = req;
  const user = await User.findById(transaction.user_id);
  if (!user) {
    return res.status(404).json(new ApiError(404, null, "user not exist"));
  }

  const therapist = await Therapist.findById(transaction.therapist_id);
  if (!therapist) {
    return res.status(404).json(new ApiError(404, null, "user not exist"));
  }
  const order_status = mapPaymentStatus(paymentDetails?.data?.responseCode);
  transaction.payment_details = paymentDetails;
  paymentDetails.payment_status = order_status;
  transaction.payment_status = order_status;
  transaction.save();
  if (transaction.payment_status !== "successful") {
    return res.status(200).json(new ApiResponse(200, paymentDetails, "this is an unsuccessful payment"))
  }
  if (transaction.type === "course") {
    try {
      const existingenrollment = await EnrolledCourse.findOne({
        transactionId: transaction._id,
      });
      if (existingenrollment) {
        return res
          .status(409)
          .json(
            new ApiError(409, "", "course enrolled already with this transaction")
          );
      }
      if (order_status === "successful") {
        const course = await Course.findById(transaction.courseId);
        const enrolledCourse = new EnrolledCourse({
          courseId: course._id,
          userId: user._id,
          transactionId: transaction._id,
          therapistId: therapist._id,
          remainingSessions: course.sessionOffered,
          isActive: true,
        });
        enrolledCourse.save();
        if (transaction?.couponCode) {
          const coupon = await Coupon.findOne({ code: transaction.couponCode });
          if (coupon) {
            coupon.usedCount += 1;
            if (coupon.usedCount == coupon.usageLimit) {
              coupon.isActive = false;
            }
            await coupon.save();
          }
        }
        const message = `${user.firstName} ${user.lastName} has successfully enrolled in a course.`;
        const htmlContent = courseEnrollmentConfirmation(
          `${user.firstName} ${user.lastName}`,
          `${therapist.firstName} ${therapist.lastName}`
        );
        const subject = "course enrollment confirmation";
        await sendNotificationsAndEmails(
          user,
          therapist,
          htmlContent,
          message,
          subject
        );
        res
          .status(201)
          .json(
            new ApiResponse(
              201,
              enrolledCourse,
              "You enrolled in course successfully"
            )
          );
      } else {
        res.status(200).json(new ApiResponse(200, null, paymentDetails.message));
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(new ApiError(500, "something went wrong in package payment validation"))
    }
  } else {
    try {
      // if (order_status !== "successful") {
      //   await Slot.updateOne({
      //     therapist_id: transaction.therapist_id,
      //     "timeslots._id": transaction.slotId,
      //   }, {
      //     $set: {
      //       "timeslots.$.isBooked": false,
      //     },
      //   })
      // }
      const slot = await Slot.findOne(
        {
          therapist_id: therapist._id,
          "timeslots._id": transaction.slotId,
        },
        {
          "timeslots.$": 1,
        }
      );
      if (order_status === "successful") {
        const existingSession = await Session.findOne({
          transaction_id: transaction._id,
        });
        if (existingSession) {
          return res
            .status(400)
            .json(
              new ApiResponse(200, existingSession, "session is already booked!")
            );
        }
        if (slot.timeslots[0].isBooked) {
          return res.status(200).json(new ApiResponse(200, transaction, "selected slot is occupied ask admin to book session manually!"))
        }
        const session = new Session({
          transaction_id: transaction._id,
          therapist_id: transaction.therapist_id,
          user_id: transaction.user_id,
          category: transaction.category,
          start_time: transaction.start_time,
          end_time: transaction.end_time,
        });
        let channelName = session._id.toString().slice(-10)
        channelName = `session_${channelName}`;
        session.channelName = channelName;
        await session.save();
        if (transaction?.couponCode) {
          const coupon = await Coupon.findOne({ code: transaction.couponCode });
          if (coupon) {
            coupon.usedCount += 1;
            if (coupon.usedCount == coupon.usageLimit) {
              coupon.isActive = false;
            }
            await coupon.save();
          }
        }
        // const monetization = await TherapistPay.findOne({
        //   $and: [
        //     { therapistId: transaction.therapist_id },
        //     { specializationId: transaction.category }
        //   ]
        // });
        // monetization.count = monetization.count + 1;
        // await monetization.save();
        const message = `${user.firstName} ${user.lastName} has successfully booked a session.`;
        const subject = "Session Booking Confirmation";
        const htmlContent = sessionBookingConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
        await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
        res
          .status(201)
          .json(new ApiResponse(201, transaction, "transaction updated  successfully and session booked"));
        res.status(200).json(new ApiResponse(200, null, paymentDetails.message));
      } else {
        res.status(200).json(new ApiResponse(200, null, paymentDetails.message));
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json(new ApiError(500, error.message))
    }
  }
})
export { handlePhonepayPayment, handleCashfreePayment, manualPaymentValidator };
