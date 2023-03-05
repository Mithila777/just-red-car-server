const express = require('express');
var jwt = require('jsonwebtoken');

const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express();
const port = process.env.PORT || 5000;

// use middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mizqz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const partsCollection = client.db('smart-car-DB').collection('parts');
        const ordersCollection = client.db('smart-car-DB').collection('orders');
        const userCollection = client.db('smart-car-DB').collection('users');
        const reviewCollection = client.db('smart-car-DB').collection('reviews');
        const paymentCollection = client.db('smart-car-DB').collection('payment');



        //for web token 
        app.post('/login', async (req, res) => {
            const user =req.body;
            var token = jwt.sign( user, 'asif',{expiresIN:'1d'});
           res.send ({token});

        });
        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
              return res.status(401).send({ message: 'UnAuthorized access' });
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, 'asif', function (err, decoded) {
              if (err) {
                return res.status(403).send({ message: 'Forbidden access' })
              }
              req.decoded = decoded;
              next();
            });
          }
          

        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });

        app.get('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query={_id: ObjectId(id)};
            const part = await partsCollection.findOne(query);
            res.send(part);
        });
        
       
        app.post('/parts', async(req, res) =>{
            const newParts = req.body;
            console.log('add a new user', newParts);
            const result = await partsCollection.insertOne(newParts);
            res.send(result);
            console.log(newParts);
        });


        app.delete('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await partsCollection.deleteOne(query);
            console.log('delete a camera', result);

            res.send(result);
        });

        app.put('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const updatedPart = req.body;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    name: updatedPart.name,
                    description: updatedPart.description,
                    price: updatedPart.price,
                    img: updatedPart.img,
                    quantity: updatedPart.quantity,
                    sold: updatedPart.sold,


                }

        

            };
            const result = await partsCollection.updateOne(filter, updatedDoc, options);
            console.log('update a camera', result);

            res.send(result);

        })

         //update user
        
        

        //add orders
        app.post('/orders', async(req, res) =>{
            const newOrder = req.body;
            const result = await ordersCollection.insertOne(newOrder);
            res.send(result);
            console.log(newOrder);
        });
        //get orders
        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = ordersCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });

        app.get('/orders/:id', async(req, res) =>{
            const id = req.params.id;
            const query={_id: ObjectId(id)};
            const order = await ordersCollection.findOne(query);
            res.send(order);
        });

        //get orders my user email 
        app.delete('/orders/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await ordersCollection.deleteOne(query);
            console.log('delete a orders', result);

            res.send(result);
        });
              
         //add users
         app.post('/users', async(req, res) =>{
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser);
            res.send(result);
            console.log(newUser);
        });

        //get users
        app.get('/users',verifyJWT, async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const authorization =req.headers.authorization;
            console.log(authorization)
            const users = await cursor.toArray();
            res.send(users);

        });

        app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({UserEmail: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          })
      
          app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            // const requester = req.decoded.email;
            // const requesterAccount = await userCollection.findOne({ email: requester });
            
                const filter = {UserEmail: email};
                const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            
            
      
          })
        
        //Update user
        app.put('/users/:email', async(req, res) =>{
            const email = req.params.email;
            const user = req.body;
            const filter = {UserEmail: email};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                     UserName:user.UserName,
                     UserEmail:user.email,
                    IserPhone :user.IserPhone,
                    UserCITY: user.UserCITY,
                    UserEducation : user.UserEducation,
                    linkdinLink :user.linkdinLink


                }

        

            };
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email },'asif', { expiresIn: '1h' })
            res.send({ result, token });
            console.log('update a user', result ,token);
        })

        //add review
        app.post('/reviews', async(req, res) =>{
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
            console.log(newReview);
        });    
            
        //get reviews
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // payment
        app.post('/create-payment-intent', async(req, res) =>{
            const order = req.body;
            const price = order.totalPrice;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret});
          });

          //add payment in database
          app.patch('/orders/:id',  async(req, res) =>{
            const id  = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
              $set: {
                status: 'paid',
                transactionId: payment.transactionId
              }
            }
      
            const result = await paymentCollection.insertOne(payment);
            const updateOrders = await ordersCollection.updateOne(filter, updatedDoc);
            res.send(updateOrders);
          })
          app.put('/order/:id',  async(req, res) =>{
            const id  = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
              $set: {
                status: 'paid',
              }
            }
      
            const updateOrders = await ordersCollection.updateOne(filter, updatedDoc);
            res.send(updateOrders);
          })

    }
    finally {

    }
}

run().catch(console.dir);

 



app.get('/', (req, res) =>{
    res.send('my api server');
});

app.listen(port, () =>{
    console.log('Server ', {port});
});