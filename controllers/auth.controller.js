import jwt from "jsonwebtoken";

//
import User from "../models/user.model";

const signToken = (userId) => jwt.sign({userId},process.env.JWT_SECRET)
// registering the user

// login the user
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "please provide email and password",
    });
  }

  const userFromDb = await User.findOne({ email }).select("+password");

  if (
    !userFromDb ||
    !(await userFromDb.checkCorrectPassword(password, userFromDb.password))
  ) {
    res.status(400).json({
      success: false,
      message: "Email or password is incorrect",
    });
  }
  const token = signToken(userFromDb._id);

  res.status(200).json({
    success: true,
    message: "Logged In Successfully",
    token,
  });
};
