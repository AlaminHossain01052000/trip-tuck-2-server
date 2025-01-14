const express = require("express");
const app = express();
const { MongoClient } = require('mongodb');
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware


app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// const uri = "mongodb+srv://<username>:<password>@cluster0.li11u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000, // Adjust the timeout values as needed
    socketTimeoutMS: 30000,
});
const isValidId = (id) => {
    const regex = /^[0-9a-fA-F]{24}$/;
    return regex.test(id);
};

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
        if (isValidId(id)) {
            const query = { _id: new ObjectId(id) }
            const bookedOffer = await bookingCollection.findOne(query)
            res.json(bookedOffer)
        }

    })
    app.get("/users/:id", async (req, res) => {

        const id = req.params.id;

        if (isValidId(id)) {

            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.json(result);
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }

    })
    app.get("/users", async (req, res) => {
        const users = await userCollection.find({}).toArray();
        res.json(users);
    })
    app.get("/user/single", async (req, res) => {
        // const users = await userCollection.find({}).toArray();
        // res.json(users);
        const particularUser = await userCollection.findOne({ email: req.query.email });
        res.json(particularUser);
    })
    app.get("/offers/:id", async (req, res) => {

        const id = req.params.id;

        if (isValidId(id)) {

            const query = { _id: new ObjectId(id) };
            const result = await offerCollection.findOne(query);
            res.json(result);
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }

    })
    // Assuming you're using Express.js
    app.put("/user/update/:userId", async (req, res) => {
        const userId = req.params.userId;
        const userData = req.body;
        if (isValidId(userId)) {
            try {
                // Exclude _id from the userData object
                delete userData._id;
    
                // Update the user data in the database
                await userCollection.updateOne({ _id: new ObjectId(userId) }, { $set: userData });
    
                // Fetch and send back the updated user data
                const updatedUser = await userCollection.findOne({ _id: new ObjectId(userId) });
                res.json(updatedUser);
            } catch (error) {
                console.error('Error updating user data:', error);
                res.status(500).json({ error: 'An error occurred while updating user data' });
            }
        } else {
            res.status(400).json({ error: 'Invalid user ID' });
        }
    });
    

    // get a particular booked offer using id
    app.put("/bookings/:id", async (req, res) => {
        const id = req.params.id;
        if (isValidId(id)) {
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: req.body.status
                },
            };
            const result = await bookingCollection.updateOne(query, updateDoc, options);
            res.json(result);
        }


    })
    app.put("/bookings/paymentStatus/:id", async (req, res) => {
        const id = req.params.id;
        if (isValidId(id)) {
            const query = { _id: new ObjectId(id) };
            const updateDoc = { $set: { paymentStatus: "paid" } };
            const options = { upsert: true };
            const updatedStatus = await bookingCollection.updateOne(query, updateDoc, options);
            res.json(updatedStatus);
        }

    })
    // deleting a offer from my bookings
    app.delete("/bookings/:id", async (req, res) => {
        if (isValidId(req.params.id)) {
            const query = { _id: new ObjectId(req.params.id) };
            const deletedOffer = await bookingCollection.deleteOne(query);
            res.json(deletedOffer);
        }


    })
    app.delete("/users/:id", async (req, res) => {
        if (isValidId(req.params.id)) {
            const query = { _id: new ObjectId(req.params.id) };
            const deletedUser = await userCollection.deleteOne(query);
            res.json(deletedUser);
        }


    })
    // book a offer using crud post

    app.post("/bookings", async (req, res) => {

        const cursor = await bookingCollection.insertOne(req.body);
        res.json(cursor);
    })
    // get all offers


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