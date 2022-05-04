const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verifyToken(req, res, next) {
   const tokenInfo = req.headers.authorization;
   if (!tokenInfo) {
      return res.status(401).send({ access: "Unauthorized" });
   }
   const token = tokenInfo.split(" ")[1];
   jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
      if (err) {
         res.status(403).send({ message: "Forbidden Access" });
      }
      console.log("decoded", decoded);
      // Set Decoded on req
      req.decoded = decoded;
      next();
   });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezgfs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   serverApi: ServerApiVersion.v1,
});

async function run() {
   try {
      await client.connect();
      const serviceCollection = client
         .db("geniusCar")
         .collection("carservices");
      const ordersCollection = client.db("geniusCar").collection("orders");

      // auth api
      app.post("/login", async (req, res) => {
         const user = req.body;
         const accessToken = jwt.sign(user, process.env.SECRET_KEY, {
            expiresIn: "1d",
         });
         res.send({ accessToken });
      });

      // service api
      app.get("/services", async (req, res) => {
         const query = {};
         const cursor = serviceCollection.find(query);
         const result = await cursor.toArray();
         res.send(result);
      });

      app.get("/services/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const service = await serviceCollection.findOne(query);
         res.send(service);
      });

      app.post("/services", async (req, res) => {
         const newService = req.body;
         const result = await serviceCollection.insertOne(newService);
         res.send(result);
      });

      app.delete("/services/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const result = await serviceCollection.deleteOne(query);
         res.send(result);
      });

      app.get("/order", verifyToken, async (req, res) => {
         const email = req.query.email;
         const decodedEmail = req.decoded.email;
         if (email === decodedEmail) {
            const query = { email: email };
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
         }else{
            res.status(403).send({message: 'Invalid Token'})
         }
      });

      app.post("/order", async (req, res) => {
         const order = req.body;
         let result = await ordersCollection.insertOne(order);
         res.send(result);
      });
   } finally {
   }
}
run().catch(console.dir());

app.get("/", (req, res) => {
   res.send("Hello World!");
});

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`);
});
