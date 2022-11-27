const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer')
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.SECRET_KEY);

app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('Mobile server is running')
})


// let transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         type: "OAuth2",
//         user: process.env.EMAIL,
//         pass: process.env.WORD,
//         clientId: process.env.OAUTH_CLIENTID,
//         clientSecret: process.env.OAUTH_CLIENT_SECRET,
//         refreshToken: process.env.OAUTH_REFRESH_TOKEN,
//     },
// });

// transporter.verify((err, success) => {
//     err
//         ? console.log(err)
//         : console.log(`=== Server is ready to take messages: ${success} ===`);
// });

// let mailOptions = {
//     from: "codersadhin@gmail.com",
//     to: process.env.EMAIL,
//     subject: "Nodemailer API",
//     text: "Hi from your nodemailer API",
// };

// transporter.sendMail(mailOptions, function (err, data) {
//     if (err) {
//         console.log("Error " + err);
//     } else {
//         console.log("Email sent successfully");
//     }
// });

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
        const adverticeCollection = client.db("OldMarket").collection("adverticeCollection");
        const sellCollection = client.db("OldMarket").collection("sellCollection");
        const paymentsCollection = client.db("OldMarket").collection("paymentsCollection");
        const blogsCollection = client.db("OldMarket").collection("blogsCollection");


        function verifyAdmin(req, res, next) {
            const decoded = req.decoded;
            if (decoded.userType !== 'admin') {
                return res.status(403).send('Forbeeden access')
            }
            next()
        }

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

        app.get('/allProduct', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.send(result)
        })

        app.get('/myProducts', verifyJWT, verifySeller, async (req, res) => {
            const email = req.decoded.email;
            const query = {
                sellerEmail: email
            }
            const products = await productsCollection.find(query).toArray();
            const paid = products.filter(product => product.paying !== 'Paid')
            res.send(paid)
        })


        app.get('/soldProducts', verifyJWT, verifySeller, async (req, res) => {
            const email = req.decoded.email;
            const query = {
                sellerEmail: email
            }
            const products = await productsCollection.find(query).toArray();
            const paid = products.filter(product => product.paying === 'Paid')
            res.send(paid)
            // console.log(result, email)
        })

        app.delete('/myProducts', verifyJWT, verifySeller, async (req, res) => {
            const id = req.query.id;
            // console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            const alreadyInter = await adverticeCollection.findOne(query);
            if (alreadyInter) {
                const deleteAdv = await adverticeCollection.deleteOne(query);
            }
            res.send(result)
        })

        // advertise section 


        app.get('/advertise', verifyJWT, verifySeller, async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };

            const findItem = await productsCollection.findOne(query);
            // console.log(result)
            const alreadyInter = await adverticeCollection.findOne(query);
            const massage = 'Already Avertice This Item';
            if (alreadyInter) {
                return res.json(massage)
            };
            const result = await adverticeCollection.insertOne(findItem);
            res.send(result)
        })

        app.get('/allAdvertise', verifyJWT, verifyAdmin, async (req, res) => {
            const findItem = await adverticeCollection.find({}).toArray();
            res.send(findItem)
            // console.log(findItem)
        })

        app.delete('/advertise', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await adverticeCollection.deleteOne(query);
            res.send(result)
            // console.log()
        })

        app.delete('/allProduct', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result)
            // console.log()
        })




        app.get('/advProduct', async (req, res) => {
            const result = await adverticeCollection.find({}).toArray();
            res.send(result)
            // console.log(result)
        })



        app.get('/brand/:brandName', async (req, res) => {
            const brandName = req.params.brandName;
            // console.log(brandName)
            const query = {
                brand: brandName
            }
            const products = await productsCollection.find(query).toArray();
            const result = products.filter(product => product.paying !== 'paid')
            // console.log(result)
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
        app.get('/allUser', verifyJWT, verifyAdmin, async (req, res) => {
            const usersFromCollection = await usersCollection.find({}).toArray();
            const users = usersFromCollection.filter(user => user.userType !== 'admin')
            // console.log(users)
            res.send(users);
        })

        app.delete('/user', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.query.id;
            const query = {
                _id: ObjectId(id)
            }
            const usersFromCollection = await usersCollection.findOne(query);
            const productQuery = {
                sellerEmail: usersFromCollection.email
            }
            const product = await productsCollection.find(productQuery).toArray();
            if (product.length > 1) {
                const anyProduct = await productsCollection.deleteMany(productQuery)
            }
            const anyProduct = await productsCollection.deleteOne(productQuery)

            const advertise = await adverticeCollection.find(productQuery).toArray();
            if (advertise.length > 1) {
                const advPxroduct = await adverticeCollection.deleteMany(productQuery)
            }
            const advPxroduct = await adverticeCollection.deleteOne(productQuery)

            const result = await usersCollection.deleteOne(query);
            res.send(result)

            // console.log(product.length, advertise)
        })


        app.get('/allSeller', verifyJWT, verifyAdmin, async (req, res) => {
            const usersFromCollection = await usersCollection.find({}).toArray();
            const users = usersFromCollection.filter(user => user.userType === 'seller')
            // console.log(users)
            res.send(users);
        })

        // seller verification section 
        app.put('/sellerVerify/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: { sellerStatus: 'verify' },
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })
        //check seller verivication
        app.get('/sellerVerify', async (req, res) => {
            const email = req.query.email;
            // console.log(id)
            const filter = {
                email: email
            }
            const result = await usersCollection.findOne(filter);
            const noStatus = 'noVerify';
            if (result === null) {
                return res.json(noStatus)
            }
            const status = result.sellerStatus;
            // console.log(status)
            res.json(status);
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
            const productId = booking.productId;
            const filter = {
                _id: ObjectId(productId)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: { paying: 'Unpaid' },
            }
            const updateProduct = await productsCollection.updateOne(filter, updateDoc, options);
            const adv = await adverticeCollection.findOne(filter);
            if (adv) {
                const adv = await adverticeCollection.deleteOne(filter);
            }
            const isertProduct = await sellCollection.insertOne(booking);

            // REMOVE FROM ADV 

            if (isertProduct) {
                res.send(result)
            }

        })

        // payment 

        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                productId: id
            }
            const result = await bookingCollection.findOne(query);
            res.send(result)
            // console.log(id, result)
        })

        app.post("/payment/intent", async (req, res) => {
            // console.log('hit')
            try {
                const { price } = req.body
                const amount = price * 100
                const paymentIntent = await stripe.paymentIntents.create({
                    currency: 'usd',
                    amount: amount,
                    "payment_method_types": [
                        "card"
                    ]
                })
                // console.log(paymentIntent)
                res.send({
                    success: true,
                    message: 'Successfully stripe payment created',
                    clientSecret: paymentIntent.client_secret
                })
            } catch (error) {
                console.log(error)
                res.send({
                    success: false,
                    error: error.message
                })
            }
        })

        app.post('/paymentsStore', verifyJWT, async (req, res) => {
            const paymentInfo = req.body;
            const id = paymentInfo.productId;
            const filter = {
                _id: ObjectId(id)
            }
            const filter2 = {
                productId: id
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: { paying: 'paid' },
            }
            const update = await productsCollection.updateOne(filter, updateDoc, options);
            const update2 = await bookingCollection.updateOne(filter2, updateDoc, options);

            const result = await paymentsCollection.insertOne(paymentInfo);
            res.send(result)
        })


        app.get('/booking', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            const email = decoded.email;
            const query = {
                buyerEmail: email
            };
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/bookingSell', verifyJWT, verifySeller, async (req, res) => {
            const decoded = req.decoded;
            const email = decoded.email;
            const query = {
                sellerEmail: email
            };
            const result = await sellCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/wishlist', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            const email = decoded.email;
            const query = {
                buyerEmail: email
            };
            const result = await wishListCollection.find(query).toArray();
            res.send(result)
            // console.log(result)
        })

        app.delete('/wishlist/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { productId: id };
            const result = await wishListCollection.deleteOne(query);
            res.send(result)
        })


        app.post('/addWish', verifyJWT, async (req, res) => {
            const wishInfo = req.body;
            const decoded = req.decoded;
            const email = decoded.email;
            wishInfo.buyerEmail = email;
            // console.log('hit korache', wishList)
            const query = {
                productId: wishInfo.productId
            }
            const itemFound = await wishListCollection.findOne(query);
            if (itemFound) {
                return res.json('Already Add To The WishList')
            }
            const result = await wishListCollection.insertOne(wishInfo);
            res.send(result)
        })


        app.post('/addReport', verifyJWT, async (req, res) => {
            const reportInfo = req.body;
            const result = await reportCollection.insertOne(reportInfo);
            res.send(result)
        })

        app.get('/reported', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.userType !== 'admin') {
                return res.status(403).send('Forbeeden access')
            }
            const products = await reportCollection.find({}).toArray();
            res.send(products);
        })

        // delete reported item api here 


        app.delete('/reportItem', verifyJWT, verifyAdmin, async (req, res) => {
            const info = req.body;
            console.log('hit koracha', info)
            // const query = { _id: ObjectId(id) };
            // const result = await productsCollection.deleteOne(query);
            // res.send(result)
        })


        // this section for add product 
        app.get('/geoLocation', async (req, res) => {
            const query = {};
            const result = await geoLocation.find(query).toArray();
            res.send(result)
        })

        // for blog api 
        app.get('/blogs', async (req, res) => {
            const query = {};
            const result = await blogsCollection.find(query).toArray();
            res.send(result)
        })

    }
    finally {

    }

}
run().catch(console.log);



















app.listen(port, () => console.log(`Mobile Server Running on port ${port}`))