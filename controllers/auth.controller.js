import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";

//
import User from "../models/user.model";
import filterObject from "../utils/filterObject";

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

// registering the user
export const register = async (req, res, next) => {
  console.log("reqBody", req.body);
  const { firstName, lastName, email, password } = req.body;

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

  // TODO : SEND EMAIL 

  res.status(200).json({
    success:true,
    message:"OTP send successfully"
  })


};

// Verify user by sent OTP
export const verifyUserByOtp = async(req,res,next) => {
   const {email,otp} = req.body;
   const user = await User.findOne({
    email,
    otpExpiryTime : {$gt: Date.now()}
   })

   if(!user){
    res.status(400).json({
      success:false,
      message:"Email is invalid or OTP has expired"
    })
   }

   if(!await user.checkCorrectOTP(otp, user.otp)){
    res.status(400).json({
      success:false,
      message:"wrong otp,please entre correct one"
    })
   }

   // if otp is correct verify the user
   user.verified = true;
   user.otp = undefined

   const token = signToken(user._id);

  res.status(200).json({
    success: true,
    message: "User verified by OTP successfully",
    token,
  });

}

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
