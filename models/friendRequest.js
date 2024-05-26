import mongoose, { model } from "mongoose";

const requestSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.ObjectId,
        ref:"User"
    },
    recepient:{
        type:mongoose.Schema.ObjectId,
        ref:"User"
    },

},{timestamps:true})

const FriendRequest = model("FriendRequest",requestSchema)
export default FriendRequest