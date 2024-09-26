import { Conversation } from "../models/conversationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

//new conv
const createNewConversation = asyncHandler(async (req, res) => {
    const { member1Id, member2Id } = req.body;
    const conversation = new Conversation({
        members: [member1Id, member2Id],
    });
    try {
        const savedConversation = await conversation.save();
        res.status(200).json(new ApiResponse(200, savedConversation, "new conversation created"));
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }

})

//get conv of a user
// const getConversation = asyncHandler(async(req,res)=>{
//     const { userId } = req.params;
//     try {
//         const conversations = await Conversation.find({ members: userId });
//         res.status(200).json(conversations);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json(err);
//     }
//  });
//get conv includes two userId
const getConversations = asyncHandler(async (req, res) => {
    const { firstUserId, secondUserId } = req.params;
    try {
        const conversation = await Conversation.findOne({
            members: { $all: [firstUserId, secondUserId] },
        });
        res.status(200).json(conversation)
    } catch (err) {
        res.status(500).json(err);
    }
})
// router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
//     try {
//         const conversation = await Conversation.findOne({
//             members: { $all: [req.params.firstUserId, req.params.secondUserId] },
//         });
//         res.status(200).json(conversation)
//     } catch (err) {
//         res.status(500).json(err);
//     }
// });

export { createNewConversation, getConversations }