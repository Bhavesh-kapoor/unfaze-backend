import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import uniqid from "uniqid";
import Cashfree from "../../config/cashfree.config.js";

const createOrder = asyncHandler(async (req, res) => {
  const { amount, email, mobile, order_currency = "INR" } = req.body;
  const user = req.user;
  const order_id = uniqid();
  let request = {
    order_amount: `${amount}`,
    order_currency: `${order_currency}`,
    order_id: `${order_id}`,
    customer_details: {
      customer_id: `${user._id}`,
      customer_phone: `${mobile}`,
    },
    order_meta: {
      return_url: `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${order_id}`,
    },
  };
  try {
    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    const paymentSessionId = response.data.payment_session_id;
    const order_id = response.data.order_id;
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paymentSessionId, order_id },
          "order Inialized successfully"
        )
      );
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to create order" });
  }
});

const verifyPayment = asyncHandler(async (req, res, next) => {
  const { order_id, course_id } = req.query;
  console.log(order_id, course_id);
  if (!order_id) {
    return res
      .status(501)
      .json(new ApiError(501, error, "order_id is required"));
  }
  try {
    const response = await Cashfree.PGFetchOrder("2023-08-01", order_id);
    console.log(response);
    const paymentDetails = response.data;
    req.course_id = course_id;
    req.paymentDetails = paymentDetails;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, "", "something went wrong!"));
  }
});

export { createOrder, verifyPayment };
