import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import { promisify } from "util";
import crypto from "crypto";

//
import User from "../models/user.model.js";
import filterObject from "../utils/filterObject.js";
import sendEmail from "../services/sendEmail.js";

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

// Signup = Register → send otp → verify otp

// registering the user
export const register = async (req, res, next) => {
  console.log("reqBody", req.body);
  const { firstName, lastName, email, password } = req.body;
  req.email = req.body.email;

  const filteredBody = filterObject(
    req.body,
    "firstName",
    "lastName",
    "email",
    "password"
  );

  // verify user either they have entered the actual email or not
  const existing_user = await User.findOne({ email });
  if (existing_user && existing_user.verified) {
    res.status(400).json({
      success: false,
      message: "Email already in use, please login",
    });
  } else if (existing_user) {
    const updated_user = await User.findOneAndUpdate({ email }, filteredBody, {
      new: true,
      validateModifiedOnly: true,
    });
    req.userId = existing_user._id;
    next();
  } else {
    // when the user record is not available in the databse
    const newUser = await User.create(filteredBody);
    // generate otp and send email to the user for verification
    req.userId = newUser._id;
    next();
  }
};

// send otp
export const sendOTP = async (req, res, next) => {
  const { userId } = req;
  const generated_otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  // calculate otp expiry
  const otpExpiryTime = Date.now() + 10 * 60 * 1000; // equivalent to 10 minutes

  await User.findByIdAndUpdate(userId, { otp: generated_otp, otpExpiryTime });

  const subject = "OTP for user verification";
  const message = `your OTP is ${generated_otp}.This otp is only valid for 10 minutes`;
  const email = req.email;
  sendEmail(email, subject, message);

  res.status(200).json({
    success: true,
    message: "OTP send successfully",
  });
};

// Verify user by sent OTP
export const verifyUserByOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otpExpiryTime: { $gt: Date.now() },
  });
  console.log("user>>>>>", user);

  if (!user) {
    res.status(400).json({
      success: false,
      message: "Email is invalid or OTP has expired",
    });
  }

  console.log(
    "checkOtpCorrection>>>>",
    otp.toString(),
    "dbotp",
    user.otp.toString()
  );

  if (
    !(await user.checkCorrectOTP(
      otp.toString().trim(),
      user.otp.toString().trim()
    ))
  ) {
    res.status(400).json({
      success: false,
      message: "wrong otp,please entre correct one",
    });
    return;
  }

  // if otp is correct verify the user
  user.verified = true;
  await user.save();

  user.otp = undefined;

  console.log("onlyUsr", user, "userVrf>>>>", user.verified);

  const token = signToken(user._id);

  res.status(200).json({
    success: true,
    message: "User verified by OTP successfully",
    token,
  });
};

// login the user
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "please provide email and password",
    });
    return;
  }

  const userFromDb = await User.findOne({ email }).select("+password");

  console.log("currPass>>", password, "dbPass", userFromDb.password);
  if (
    !userFromDb ||
    !(await userFromDb.checkCorrectPassword(password, userFromDb.password))
  ) {
    res.status(400).json({
      success: false,
      message: "Email or password is incorrect",
    });
    return;
  }
  const token = signToken(userFromDb._id);

  res.status(200).json({
    success: true,
    message: "Logged In Successfully",
    token,
  });
};

export const protect = async (req, res, next) => {
  let token;

  // 1) Extracting token form headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    res.status(400).json({
      success: false,
      message: "You are not logged In! please LoggedIn first to get Access",
    });
    return;
  }

  // 2) verification of token
  const decodedJwt = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exist
  const current_user = await User.findById(decodedJwt.userId);
  if (!current_user) {
    res.status(400).json({
      success: false,
      message: "User not found,jwt expired",
    });
  }

  // check if a user is logged in and we issue the token then another user came on the same email and try to reset the password and if they successfylly reset the password then i have to remove or kicked out the first user who enterd previously before changing the password.

  if (current_user.changedPasswordAfter(decodedJwt.iat)) {
    // here iat is timestamp when the token genetated, see it on https://jwt.io/
    res.status(400).json({
      success: false,
      message: "User Updated password recently! please login again",
    });
  }
  req.user = current_user;
  next();
};

// forgot password
export const forgotPassword = async (req, res, next) => {
  // 1. Get user email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(400).json({
      success: false,
      message: "user not found with the provided email",
    });
    return;
  }

  // 2. Generate the random reset token
  const resetToken = await user.createForgotPasswordToken();
  const resetUrl = `https://localhost:6000/auth/reset-passwrod/?code=${resetToken}`;
  try {
    console.log("resettoken", resetToken);

    // TODO : send email with reset url

    const subject = "Reset your passwrod";
    const message = `Click on this  ${resetUrl}. to reset your passwrod and set an new password`;
    const email = req.body.email;
    sendEmail(email, subject, message);

    user.forgotPasswordToken = resetToken;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Sent password reset link to email",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      success: false,
      message: "Error in sending email, Try later",
    });
    return;
  }
};

export const resetPassword = async (req, res, next) => {
  // generate hashed token

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: req.body.token,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  // 2) if token has expired or submission is out of window

  if (!user) {
    res.status(400).json({
      success: false,
      message: "Token is invalid or expired",
    });
    return; // make sure to exit the flow of code
  }

  // 3) update user password and set forgot token and expiry to undefined

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  // 4) Login the user and send email and jwt token

  // TODO : send an email to the user, informing about the password change

  const token = signToken(user._id);

  res.status(200).json({
    success: true,
    message: "password reset successfully",
    token,
  });
  return;
};
