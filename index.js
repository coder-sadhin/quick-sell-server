const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('Mobile server is running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bbbtstv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('UnAuthorized Access')
    }
    const token = authHeader.split(' ')[1];
    // console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            console.log('token a somossa')
            return res.status(403).send({ Massage: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {

    try {
        const brandCollection = client.db("OldMarket").collection("brandCollection");
        const usersCollection = client.db("OldMarket").collection("usersCollection");
        const geoLocation = client.db("OldMarket").collection("geoLocation");
        const productsCollection = client.db("OldMarket").collection("productsCollection");
        const bookingCollection = client.db("OldMarket").collection("bookingCollection");
        const wishListCollection = client.db("OldMarket").collection("wishListCollection");
        const reportCollection = client.db("OldMarket").collection("reportCollection");

        function verifySeller(req, res, next) {
            const decoded = req.decoded;
            if (decoded.userType !== 'seller') {
                return res.status(403).send('Forbeeden access')
                console.log('apni ki seller non')
            }
            next()
        }




        // this api for home page brand image 
        app.get('/brands/home', async (req, res) => {
            const query = {};
            const result = await brandCollection.find(query).limit(5).toArray();
            res.send(result)
        })

        // this api for brands page brand image

        app.get('/brands', async (req, res) => {
            const query = {};
            const result = await brandCollection.find(query).toArray();
            res.send(result)
        })

        // this is for product collection 

        app.post('/product', verifyJWT, verifySeller, async (req, res) => {
            const data = req.body;
            // console.log(data)
            const result = await productsCollection.insertOne(data)
            res.send(result)
        })

        app.get('/allProduct', async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.send(result)
        })

        app.get('/myProducts', verifyJWT, verifySeller, async (req, res) => {
            const email = req.decoded.email;
            const query = {
                sellerEmail: email
            }
            const result = await productsCollection.find(query).toArray();
            res.send(result)
            // console.log(result, email)
        })

        app.delete('/myProducts', verifyJWT, verifySeller, async (req, res) => {
            const id = req.query.id;
            // console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        app.get('/brand/:brandName', async (req, res) => {
            const brandName = req.params.brandName;
            // console.log(brandName)
            const query = {
                brand: brandName
            }
            const result = await productsCollection.find(query).toArray();
            res.send({ result, brandName })
        })

        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await productsCollection.findOne(query);
            res.send(result)
            // console.log(result)
        })


        // this is for all user api 
        app.get('/allUser', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.userType !== 'admin') {
                return res.status(403).send('Forbeeden access')
            }
            const users = await usersCollection.find({}).toArray();
            res.send(users);
        })

        // this section for user login and registration 

        app.post('/addUsers', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // this is check user type 
        app.get('/checkuser/type', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const user = await usersCollection.findOne(query)
            if (!user) {
                return res.status(401).send('not verify')
            }
            const userType = user.userType;
            // console.log(user)
            res.json(userType);
        })

        // this is user token 

        app.post('/user/jwt', (req, res) => {
            const user = (req.body)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN)
            res.send({ token })
            // console.log(user)
        })

        // bookingCollection

        app.post('/booking', verifyJWT, async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })


        app.post('/addWish', verifyJWT, async (req, res) => {
            //     const booking = req.body;
            const decoded = req.decoded;
            const email = decoded.email;
            const id = req.query.id;
            //     // const email = decoded.email;
            const wishList = { email, id }
            // console.log('hit korache', wishList)
            const result = await wishListCollection.insertOne(wishList);
            res.send(result)
        })

        app.post('/addReport', verifyJWT, async (req, res) => {
            //     const booking = req.body;
            const decoded = req.decoded;
            const email = decoded.email;
            const id = req.query.id;
            //     // const email = decoded.email;
            const wishList = { email, id }
            // console.log('hit korache', wishList)
            const result = await reportCollection.insertOne(wishList);
            res.send(result)
        })

        // this section for add product 
        app.get('/geoLocation', async (req, res) => {
            const query = {};
            const result = await geoLocation.find(query).toArray();
            res.send(result)
        })





    }
    finally {

    }

}
run().catch(console.log);



















app.listen(port, () => console.log(`Mobile Server Running on port ${port}`))