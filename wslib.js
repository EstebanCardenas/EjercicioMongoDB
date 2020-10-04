const WebSocket = require("ws");
//mongodb
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://chatMaster:chatMaster666@chatcluster.7wucj.mongodb.net/chatdb?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const clients = [];

const wsConnection = async (server) => {
  await client.connect();
  const db = client.db('chatdb');
  const coll = db.collection('messages');
  let messages = coll.find({}).toArray();
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    clients.push(ws);
    sendMessages();

    ws.on("message", (message) => {
      messages.push(message);
      sendMessages();
    });
  });

  const sendMessages = () => {
    clients.forEach((client) => client.send(JSON.stringify(messages)));
  };
};

exports.wsConnection = wsConnection;