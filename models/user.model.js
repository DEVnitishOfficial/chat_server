import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    avatar: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      unique: [true, "already registered"],
      match: [
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "please entre a valid email address(db)",
      ],
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [5, "password must be at least five character"],
      select: false,
    },
    confirmPassword:{
      type:String,
    },
    passwordChangedAt: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: Number,
    },
    otpExpiryTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// run this middleware only when the otp actually has changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();
  // hash the otp
  this.otp = await bcrypt.hash(this.otp, 10);
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // hash the password
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// checking user password
userSchema.methods.checkCorrectPassword = async function (
  currentUserPassword,
  dbUserPassword
) {
  // return await bcrypt.compare(currentUserPassword, dbUserPassword);
  return currentUserPassword === dbUserPassword
};
// checking otp
userSchema.methods.checkCorrectOTP = async function (
  currentUserOtp,
  dbUserOtp
) {
  return currentUserOtp === dbUserOtp;
};

userSchema.methods.createForgotPasswordToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    this.forgotPasswordExpiry = Date.now() + 10*60*1000 // 10min
    return resetToken
};

userSchema.methods.changedPasswordAfter = async function(timestamp){
 return timestamp < this.passwordChangedAt
}

const User = model("User", userSchema);

export default User;
