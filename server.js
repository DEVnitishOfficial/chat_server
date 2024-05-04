import mongoose from "mongoose";
import app from "./app.js";

// event listener
process.on("uncaughtException", (error) => {
  console.log("error from server.js file", error);
  process.exit(1);
});

import http from "http";

const port = process.env.PORT || 7000;
const server = http.createServer(app);

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

process.on("unhandledRejection", (error) => {
  console.log(error);
  server.close(() => {
    process.exit(1);
  });
});
