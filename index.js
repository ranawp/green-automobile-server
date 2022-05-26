const express = require('express')
const app = express()
const cors = require('cors')
var jwt = require('jsonwebtoken');

require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express')

//middelware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xywq3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    console.log('jwt token')
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unathurized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded
        next()
    });
}

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


        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
            res.send({ result, token })

        })

        //get all user 
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users)
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

        // app.get('/bookings', verifyJWT, async (req, res) => {
        //     const user = req.query.email;
        //     const decodedEmail = req.decoded.email;
        //     if (user === decodedEmail) {
        //         const query = { user: user };
        //         const cursor = bookingCollection.find(query);
        //         const products = await cursor.toArray();
        //         res.send(products)
        //     }
        //     else {
        //         return res.status(403).send({ message: 'forbidden acces' })
        //     }

        //     // const authorization = req.headers.authorization;
        //     // console.log('auth header', authorization)

        // })
        //backup 
        app.get('/bookings', async (req, res) => {

            const query = {};

            const cursor = bookingCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        })

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