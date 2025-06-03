const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./models/Item');

const mongoUri = process.env.MONGO_URI;

const sampleItems = [
  {
    itemName: 'Robotic Arm',
    ownerId: '2023AIB1017',
    totalQuantity: 15,
    availableQuantity: 10
  },
  {
    itemName: 'Servo Motor',
    ownerId: '2023AIB1011',
    totalQuantity: 30,
    availableQuantity: 25
  },
  {
    itemName: 'Ultrasonic Sensor',
    ownerId: '2023AIB1019',
    totalQuantity: 20,
    availableQuantity: 20
  },
  {
    itemName: 'Microcontroller Board',
    ownerId: '2023AIB1101',
    totalQuantity: 50,
    availableQuantity: 45
  }
];

async function seedDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    // Optional: Clear existing data (uncomment if needed)
    // await Item.deleteMany({});

    await Item.insertMany(sampleItems);
    console.log('Sample items inserted');

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seedDB();
