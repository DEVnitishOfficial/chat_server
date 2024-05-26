import FriendRequest from "../models/friendRequest.js";
import User from "../models/user.model.js";
import filterObject from "../utils/filterObject.js";

export const updateMe = async (req, res, next) => {
  const { user } = req;
  const filteredBody = filterObject(
    req.body,
    "firstName",
    "lastName",
    "avatar",
    "about"
  );
  const updatedUser = await User.findByIdAndUpdate(user._id, filteredBody, {
    new: true,
    validateModifiedOnly: true,
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: "User Profile updated successfully",
  });
};

export const getUser = async (req, res, next) => {
  const allUsers = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const current_user = req.user;
  // here current_user is reffering to document that's why we can access friends from the model
  const remaining_user = allUsers.filter(
    (user) =>
      !current_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );

  res.status(200).json({
    success:true,
    data:remaining_user,
    message:"User found successfully"
  })
};

export const getRequest = async (req,res,next) => {
  const request = await FriendRequest.find({recepient:req.user._id}).populate("sender","_id firstName lastName")

  res.status(200).json({
    success:true,
    data:request,
    message:"Friends request found successfully !!"
  })
}

export const getFriends = async (req, res, next) => {
  const current_User = await User.findById(req.user._id).populate("friends","_id firstName lastName")

  res.status(200).json({
    success:true,
    data:current_User.friends,
    message:"Friends found successfully !!"
  })
}
