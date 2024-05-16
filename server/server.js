const { MongoClient } = require('mongodb'); 
const mongoose = require('mongoose')
const Document = require("./Document")
const dotenv = require('dotenv')

dotenv.config()

const user = process.env.user;
const password = process.env.password;

mongoose.connect(`mongodb+srv://${user}:${password}@cowrite.bijunjq.mongodb.net/?retryWrites=true&w=majority&appName=CoWrite`)

const io = require('socket.io')(3001, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const defaultValue = "";

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, {data})
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id)
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue})
}