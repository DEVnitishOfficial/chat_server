import mongoose, { model } from "mongoose";

const requestSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.ObjectId,
        ref:""
    },
    recepient:{
        type:mongoose.Schema.ObjectId,
        ref:""
    },

},{timestamps:true})

const friendRequest = model("friendRequest",requestSchema)
export default friendRequest