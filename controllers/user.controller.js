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
    success:true,
    data : updatedUser,
    message : "User Profile updated successfully"
  })
};
