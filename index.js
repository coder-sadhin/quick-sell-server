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
        console.log('26')
        return res.status(401).send('UnAuthorized Access')
    }
    const token = authHeader.split(' ')[1];
    // console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            console.log('33')
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

        app.post('/product', async (req, res) => {
            const product = req.body;
            console.log(product)
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })

        // this section for user login and registration 

        app.post('/addUsers', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // this is check user type 
        app.get('/checkuser', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const user = await usersCollection.findOne(query)
            if (!user) {
                return
            }
            const userType = user.userType;
            // console.log(userType)
            res.json(userType);
        })

        // this is user token 

        app.post('/user/jwt', (req, res) => {
            const user = (req.body)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN)
            res.send({ token })
            // console.log(user)
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