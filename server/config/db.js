const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        console.error('Giving up on MongoDB connection.');
        process.exit(1);
      }
      await sleep(2 ** attempt * 1000); // 2s, 4s, 8s, 16s
    }
  }
};

module.exports = connectDB;