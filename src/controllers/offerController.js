import { differenceInDays } from "date-fns";
import Offer from "../models/NewOfferModal.js";
import { Coupon } from "../models/couponModel.js";
import { User } from "../models/userModel.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  makeParameterForWATTI,
  sendTemplateMultipleUserMessages,
} from "./wattiTemplates.js";

export const createOffer = async (req, res) => {
  try {
    const couponExist = await Coupon.findById(req.body.couponId);
    if (!couponExist)
      return res.status(404).json({ message: "Coupon not found" });

    const newOffer = new Offer(req.body);
    const savedOffer = await newOffer.save();
    return res
      .status(201)
      .json(
        new ApiResponse(201, savedOffer, "Your review has been submitted!")
      );
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong!" });
  }
};

export const getAllOffers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const offers = await Offer.find({})
      .populate({
        path: "couponId",
        model: "Coupon",
        select: "code expiryDate visibility isActive",
      })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalOffer = await Offer.countDocuments();

    const result = [];
    offers.map((item) =>
      result.push({
        _id: item?._id,
        isActive: item?.isActive,
        code: item?.couponId?.code,
        sentToUsersAt: item?.sentToUsersAt,
        couponId: item?.couponId?.couponId,
        expiryDate: item?.couponId?.expiryDate,
        visibility: item?.couponId?.visibility,
        isCouponActive: item?.couponId?.isActive,
        notificationCount: item?.notificationCount,
      })
    );

    return res.status(200).json(
      new ApiResponse(
        true,
        {
          result: result,
          pagination: {
            totalItems: totalOffer,
            currentPage: pageNumber,
            itemsPerPage: limitNumber,
            totalPages: Math.ceil(totalOffer / limitNumber),
          },
        },
        "Offers Fetched Successfully "
      )
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const availableCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.aggregate([
      {
        $lookup: {
          from: "offers",
          localField: "_id",
          foreignField: "couponId",
          as: "offerDetails",
        },
      },
      { $match: { offerDetails: { $eq: [] } } },
      { $project: { _id: 1, code: 1 } },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(true, coupons, "Fetched Successfully"));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate("couponId");
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    let result = {
      _id: offer._id,
      title: offer?.title,
      code: offer.couponId.code,
      isActive: offer?.isActive,
      couponId: offer.couponId._id,
      description: offer?.description,
      sentToUsersAt: offer?.sentToUsersAt,
      notificationCount: offer?.notificationCount,
    };

    return res
      .status(200)
      .json(new ApiResponse(true, result, "Fetched Successfully"));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateOfferById = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!offer) return res.status(404).json({ message: "offer not found" });
    return res
      .status(200)
      .json(new ApiResponse(true, offer, "Updated Successfully"));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteOfferById = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const sendMessageToWhatsapp = async (req, res) => {
  try {
    const id = req.params.id;
    const getOfferDetails = await Offer.findById(id).populate("couponId");
    if (!getOfferDetails)
      return res.status(404).json({ message: "Offer not found" });

    // Get the current date and the coupon expiry date
    const now = new Date();
    const expiryDate = getOfferDetails?.couponId?.expiryDate;

    // Calculate days left until expiry
    let validity = "";
    if (expiryDate) {
      const daysLeft = differenceInDays(new Date(expiryDate), now);
      validity = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`; // Format validity message
    }

    // Fetch users with mobile numbers
    let userList = await User.find(
      {
        mobile: { $exists: true, $ne: "" },
        role: "user",
      },
      { _id: 1, firstName: 1, lastName: 1, mobile: 1 }
    );

    if (process.env.NODE_ENV !== "prod") userList = userList.slice(0, 2);

    const receivers = userList.map((user) => ({
      whatsappNumber: user?.mobile,
      customParams: makeParameterForWATTI({
        offer_title: getOfferDetails?.title,
        name: `${user?.firstName} ${user?.lastName}`,
        offer_details: getOfferDetails?.description,
        validity: validity,
      }),
    }));

    // Send messages to multiple users
    if (
      (userList.length === receivers.length &&
        process.env.NODE_ENV === "prod") ||
      (receivers.length === 2 && process.env.NODE_ENV === "dev")
    ) {
      const resp = await sendTemplateMultipleUserMessages(
        "new_offer_for_user",
        receivers
      );
      if (resp && !resp?.message) {
        const body = {
          sentToUsersAt: new Date(),
          title: getOfferDetails?.title,
          isActive: getOfferDetails?.isActive,
          couponId: getOfferDetails?.couponId,
          description: getOfferDetails?.description,
          notificationCount: (getOfferDetails?.notificationCount ?? 0) + 1,
        };
        const offer = await Offer.findByIdAndUpdate(req.params.id, body, {
          new: true,
        });

        return res.status(200).json(new ApiResponse(true, offer, "sent"));
      } else {
        return res
          .status(200)
          .json(new ApiResponse(true, { data: "" }, resp?.message));
      }
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
