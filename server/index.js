const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Error: MONGO_URI not defined in .env file');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import routers
const productsRouter = require('./routes/products');
const addproductRouter = require('./routes/addproduct'); 
const updateproductRouter = require('./routes/updateproduct'); 
const requestitem = require('./routes/requestitem'); 
const processrequest = require('./routes/processrequest'); 

// Routes
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

app.use('/products', productsRouter);
app.use('/addproduct', addproductRouter);
app.use('/updateproduct', updateproductRouter);
app.use('/requestitem',requestitem);
app.use('/processrequest',processrequest);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
