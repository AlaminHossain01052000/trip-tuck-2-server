const express = require("express");
const app = express();
const { MongoClient } = require('mongodb');
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();
// const twilio = require('twilio'); 

//twilio requirements -- Texting API 
// const accountSid = 'ACf4014a2148a64c2eef660da93718974a';
// const authToken = 'db7bb8253f5533d197cc317e3189adaf'; 
// const client2 = new twilio(accountSid, authToken);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://trip-tuck:7sNdJlGKJnISbITs@cluster0.li11u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000, // Adjust the timeout values as needed
    socketTimeoutMS: 30000,
  });
  

async function run() {
    await client.connect();
    const database = client.db("trip_tuck");
    const offerCollection = database.collection("offers");
    const bookingCollection = database.collection("bookings");
    const userCollection = database.collection("users");
    // get all offers
    app.get("/offers", async (req, res) => {
        const offers = await offerCollection.find({}).toArray();
        res.json(offers);
    })

    // add a new offer
    app.post("/offers", async (req, res) => {
        const newOffer = await offerCollection.insertOne(req.body);
        res.json(newOffer)
    })
    // get booked offers
    app.get("/bookings", async (req, res) => {
        const bookings = await bookingCollection.find({}).toArray();
        res.json(bookings);
    })
    // get all the booked offer of a particular user
    app.get("/bookings/:email", async (req, res) => {
        const query = { email: req.params.email }
        const bookedOffers = await bookingCollection.find(query).toArray();
        res.json(bookedOffers)
    })
    app.get("/bookings/singleBooking/:id", async (req, res) => {
        const id = req.params.id
        const query={_id:new ObjectId(id)}
        const bookedOffer = await bookingCollection.findOne(query)
        res.json(bookedOffer)
    })
    // get a particular booked offer using id
    app.put("/bookings/:id", async (req, res) => {

        const query = { _id: new ObjectId(req.params.id) }
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                status: req.body.status
            },
        };
        const result = await bookingCollection.updateOne(query, updateDoc, options);
        res.json(result);

    })
    app.put("/bookings/paymentStatus/:id", async (req, res) => {
        const id = req.params.id;

        const query = { _id: new ObjectId (id) };
        const updateDoc = { $set: { paymentStatus: "paid" } };
        const options = { upsert: true };
        const updatedStatus = await bookingCollection.updateOne(query, updateDoc, options);
        res.json(updatedStatus);
    })
    // deleting a offer from my bookings
    app.delete("/bookings/:id", async (req, res) => {
        const query = { _id: new ObjectId(req.params.id) };
        const deletedOffer = await bookingCollection.deleteOne(query);
        res.json(deletedOffer);

    })
    // book a offer using crud post

    app.post("/bookings", async (req, res) => {
        
        const cursor = await bookingCollection.insertOne(req.body);
        res.json(cursor);
    })
    // get all offers
    app.get("/users", async (req, res) => {
        const users = await userCollection.find({}).toArray();
        res.json(users);
    })

    // add a new offer
    app.put("/users", async (req, res) => {
        const user = await userCollection.insertOne(req.body);
        res.json(user)
    })
    

}
run().catch(console.dir);
//twillo things
// try {
//     app.get('/send-text', (req, res) => {
//         //Welcome Message
//         res.send('Hello to the Twilio Server')
    
//         //_GET Variables
//         const { recipient, textmessage } = req.query;
    
    
//         //Send Text
//         // client2.messages.create({
//         //     body: textmessage,
//         //     to: recipient,  // Text this number
//         //     from: '+17178976085' // From a valid Twilio number
//         // }).then((message) => console.log(message.body));
//     }) 
// } catch (error) {
//     console.log(error)
// }

app.get("/", (req, res) => {
    res.send("Server is running")
})

app.listen(port, () => {
    console.log("Listening to port", port)
})