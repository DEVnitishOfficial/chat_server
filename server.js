import app from "./app.js";
import http from 'http'

const port = process.env.PORT || 7000
const server = http.createServer(app)

server.listen(port,()=> {
    console.log(`server is listening at port ${port}`)
})