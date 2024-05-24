import mongoose from "mongoose";
import app from "./app.js";
import { Server } from "socket.io";


// event listener
process.on("uncaughtException", (error) => {
  console.log("error from server.js file", error);
  process.exit(1);
});

import http from "http";
import User from "./models/user.model.js";

const port = process.env.PORT || 7000;
const server = http.createServer(app);


const io = new Server(server,{
  cors:{
    origin:"http://localhost:3001",
    methods:["GET","POST"]
  }
});


const connectToDB = async () => {
    try {
      const {connection} = await mongoose.connect(process.env.MONGO_URI);
    
      if(connection){
        console.log(`Connected to MongodDB at : ${connection.host}`)
      }
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  
  };
  connectToDB()

server.listen(port, () => {
  console.log(`server is listening at port ${port}`);
});

io.on('connection',async(socket) => {
  console.log('explore the socket>>>>>',socket)
  const user_id = socket.handshake.query["user_id"]
  const socket_id = socket.id
  console.log(`User connected with the socket id ${socket_id}`)

  if(user_id){
    await User.findByIdAndUpdate(user_id,{socket_id})
  }

  // we can write our socket event listener here

  socket.on("friend_request",() => {
   console.log('data>>>',data.io) 
  })
})

process.on("unhandledRejection", (error) => {
  console.log(error);
  server.close(() => {
    process.exit(1);
  });
});
