import mongoose from "mongoose";
import app from "./app.js";
import { Server } from "socket.io";
import path from "path";

// event listener
process.on("uncaughtException", (error) => {
  console.log("error from server.js file", error);
  process.exit(1);
});

import http from "http";
import User from "./models/user.model.js";
import FriendRequest from "./models/friendRequest.js";
import OneToOneMessage from "./models/oneToOneMessage.js";

const port = process.env.PORT || 7000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

const connectToDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);

    if (connection) {
      console.log(`Connected to MongodDB at : ${connection.host}`);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
connectToDB();

server.listen(port, () => {
  console.log(`server is listening at port ${port}`);
});

io.on("connection", async (socket) => {
  console.log(JSON.stringify(socket.handshake.query));
  console.log("explore the socket>>>>>", socket);
  const user_id = socket.handshake.query["user_id"];
  const socket_id = socket.id;
  console.log(`User connected with the socket id ${socket_id}`);

  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, { socket_id, status: "Online" });
  }

  // we can write our socket event listener here

  socket.on("friend_request", async (data) => {
    console.log("data>>>", data.to);
    // data => {to, from}, here to and from will be id

    const to_user = await User.findById(data.to).select("socket_id");
    const from_user = await User.findById(data.from).select("socket_id");

    // create a friend request
    await FriendRequest.create({
      sender: data.from,
      recepient: data.to,
    });
    // TODO : create a friend request
    // receiver ====>>> friend request
    // emit event = "new_friend_request"
    io.to(to_user.socket_id).emit("new_friend_request", {
      message: "New Friend request Received",
    });
    // sender ====>>> friend request
    // emit event => "request sent"
    io.to(from_user.socket_id).emit("request_sent", {
      message: "Friend request sent successfully",
    });
  });

  socket.on("accept_request", async (data) => {
    console.log("data>>>", data);

    const request_doc = await FriendRequest.findById(data.request_id);

    console.log(request_doc);

    // sender
    const sender = await User.findById(request_doc.sender);
    // receiver
    const receiver = await User.findById(request_doc.recepient);

    sender.friends.push(request_doc.recepient);
    receiver.friends.push(request_doc.sender);

    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    await findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request_accepted", {
      message: "Friend Request  Accepted",
    });

    io.to(receiver.socket_id).emit("request_accepted", {
      message: "Friend Request  Accepted",
    });
  });

  socket.on("get_direct_conversation", async ({ user_id }, callback) => {
    const existing_conversation = await OneToOneMessage.find({
      participants: { $all: [user_id] },
    }).populate("participants", "firstName lastName _id email status");

    console.log(existing_conversation);

    callback(existing_conversation);
  });
  socket.on("start_conversation", async (data) => {
    // data : {to, from}
    const { to, from } = data;
    // checking if there is any existing conversation between these two users
    const existing_conversation = await OneToOneMessage.find({
      participants : {$size:2, $all:[to, from]},
    }).populate("participants","firstName lastName _id email status");
    console.log("existing conversation",existing_conversation[0])
    
    //  if no existing_conversation
    if(existing_conversation.length === 0){
      let new_chat = await OneToOneMessage.create({
        participants:[to,from],
      });
      new_chat = await OneToOneMessage.findById(new_chat._id).populate("participants","firstName lastName _id email status")
      console.log('new_chat>>>',new_chat)
      socket.emit("start_chat",new_chat)
    }


    //  if there is existing_conversation
    else{
      socket.emit("start_chat", existing_conversation[0])
    }

  });

  socket.on("get_messages",async (data,callback) => {
    const {messages} = await OneToOneMessage.findById(data.conversation_id).select("messages");
    callback(messages)
  })
  
  // handle text/link messages
  socket.on("text", async(data) => {
    console.log("Received Messages", data);

    // data : {to, from, message, conversation_id, type}

    const {to, from, message, conversation_id, type} = data
    const to_user = await User.findById(to)
    const from_user = await User.findById(from)

    const new_message = {
      to,
      from,
      type,
      text: message,
      created_at : Date.now()
    }
    // create a new conversation if it doesn't exist yet or add new message in the existing one(message list)
    const chat = await OneToOneMessage.findById(conversation_id)
    chat.messages.push(new_message);

    // save to db
    await chat.save({})


    // emit  new_message ====>>> to user
    io.to(to_user.socket_id).emit("new_message",{
      conversation_id,
      message:new_message,
    })

    // emit new_message ====>>> from user
    io.to(from_user.socket_id).emit("new_message",{
      conversation_id,
      message:new_message,
    })
  });

  socket.on("file_message", (data) => {
    console.log("Received Messages", data);

    // data : {to, from, text, files}

    //get the file extension
    const fileExtension = path.extname(data.file.name);

    // generate unique fileName
    const fileName = `${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}_${fileExtension}`;

    // upload file to aws S3

    // create a new conversation if it doesn't exist yet or add new message in the existing one(message list)

    // save to db

    // emit incoming messages ====>>> to user

    // emit outgoing messages ====>>> from user
  });

  // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

  socket.on("end", async (data) => {
    // find userbyid and set user status offline
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }
    // Todo : Broadcast user disconnected
    console.log("Closing connection");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (error) => {
  console.log(error);
  server.close(() => {
    process.exit(1);
  });
});
