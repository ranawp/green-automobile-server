const express = require('express')
const app = express()
const cors = require('cors')
var jwt = require('jsonwebtoken');

require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const res = require('express/lib/response');

//middelware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xywq3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// function verifyJWT(req, res, next) {
//     console.log('jwt token')
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//         return res.status(401).send({ message: 'Unathurized access' })
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'Forbidden access' })
//         }
//         req.decoded = decoded
//         next()
//     });
// }

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('manufecture').collection('products');
        const userCollection = client.db('manufecture').collection('users');
        const bookingCollection = client.db('manufecture').collection('bookings');
        const reviewCollection = client.db('manufecture').collection('reviews');



        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        });

        //get admin email and it admin dashboard
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        //make  admin api  
        app.put('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);

            res.send(result)

        })


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '100hr' })
            res.send({ result, token })

        })

        //get all user 
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users)
        })

        // const user = req.params.user
        // console.log(req.params)
        // const query = { user: user }
        // const result = await bookingCollection.find(query).toArray()
        // res.send(result)

        // //for get single user...
        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id }
            const result = await userCollection.find(query).toArray
                ()
            res.send(result)
            // console.log(result)
        })


        //updated user 
        app.put('users/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    name: updatedUser.name,
                    contactNumber: updatedUser.contactNumber,
                    location: updatedUser.location,
                    linkdin: updatedUser.linkdin,
                    education: updatedUser, education
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)
            console.log(result)
        })


        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product)
        })


        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct)
            res.send(result)
        })

        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const newBoonkings = req.body;

            const products = await bookingCollection.insertOne(newBoonkings)
            res.send(products)
        })


        //backup 
        // const userBooking = req.query.user;
        // const query = { userBooking: user };
        // const orders = await bookingCollection.find(query).toArray();
        // res.send(orders);

        //all bookings items 
        app.get('/bookings', async (req, res) => {
            const query = {};
            const cursor = bookingCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        })

        // for getting my booking items 
        app.get('/bookings/:user', async (req, res) => {
            const user = req.params.user
            console.log(req.params)
            const query = { user: user }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
            // console.log(result)
            // console.log(result)
        })

        // app.get("/bookings", verifyJWT, async (req, res) => {
        //     const decodedEmail = req.decoded.email;
        //     const user = req.query.user;
        //     // console.log(email);
        //     if (email == decodedEmail) {
        //       const query = { email: email };
        //       const cursor = orderCollection.find(query);
        //       const myorders = await cursor.toArray();
        //       res.send(myorders);
        //     } else {
        //       res.status(403).send({ message: "forbidden access" });
        //     }
        //   });

        app.post('/reviews', async (req, res) => {
            const newReviews = req.body;
            const reviews = await reviewCollection.insertOne(newReviews)
            res.send(reviews)
        })

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews)
        })

    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello world')
})


app.listen(port, () => {
    console.log('starting express', port)
})