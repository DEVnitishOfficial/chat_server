import { Schema } from "mongoose";
import bcrypt from "bcryptjs"

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
    passwordChangedAt: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.checkCorrectPassword = async function (
  currentUserPassword,
  dbUserPassword
) {
    return await bcrypt(currentUserPassword,dbUserPassword)
};

const User = model("User", userSchema);

export default User;
