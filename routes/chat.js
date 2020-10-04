var express = require('express');
const { route } = require('../app');
var router = express.Router();
const joi = require('joi');

//mongodb
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://chatMaster:chatMaster666@chatcluster.7wucj.mongodb.net/chatdb?retryWrites=true&w=majority";
const client = new MongoClient(uri);

function valid(msg) {
  const schema = joi.object({
    message: joi.string().required().min(5),
    author: joi.string().required().pattern(/^[a-zA-Z]+\s[a-zA-Z]+$/),
    ts: joi.number().required()
  })
  let validation = schema.validate(msg);
  if ("error" in validation)
    return false;
  else
    return true;
}

async function run() {
  await client.connect();

  const db = client.db('chatdb');
  const coll = db.collection('messages');

  /* GET messages */
  router.get('/', async function(req, res, next) {
    let all = await coll.find({}).toArray();
    res.send(all);
  });

  /* GET message w/ specific ts */
  router.get('/:ts', async (req, res) => {
    let t = parseInt(req.params.ts);
    const query = await coll.find({
      ts: t
    }).toArray();
    if (query.length == 0) {
      res.status(404);
      res.send("Mensaje no encontrado")
    } else {
      res.send(query);
    }
  });

  /* POST message */
  router.post('/', async (req, res) => {
    if (valid(req.body)) {
      const t = parseInt(req.body["ts"]);
      let rep = await coll.findOne({
        ts: t
      });
      if (rep == null) {
        coll.insertOne(req.body);
        res.send("Mensaje insertado");
      } else {
        res.status(403);
        res.send("El mensaje con el ts ya existe");
      }
    } else {
      res.status(403);
      res.send("El mensaje no es válido");
    }
  });

  /* UPDATE message */
  router.put('/', (req, res) => {
    if (valid(req.body)) {
      let t = parseInt(req.body["ts"]);
      const q = {ts: t};
      const update = { $set: {
        message: req.body["message"],
        author: req.body["author"]
      }};
      coll.updateOne(q, update, {}).then(result => {
        if (result["result"]["nModified"] == 0) {
          res.status(404);
          res.send("El mensaje con el ts no fue encontrado");
        } else {
          res.send("Mensaje actualizado");
        }
      });
    } else {
      res.status(403);
      res.send("El mensaje no es válido");
    }
  });

  /* DELETE message */
  router.delete('/:ts', (req, res) => {
    let t = parseInt(req.params.ts);
    const doc = {
      ts: t
    };
    coll.deleteOne(doc).then(result => {
      if (result["deletedCount"] != 0) {
        res.send("Mensaje eliminado")
      } else {
        res.status(404);
        res.send("El mensaje con el ts no existe");
      }
    })
  });
}

run().catch(console.dir);

module.exports = router;