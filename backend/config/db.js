const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not set');
    process.exit(1);
  }

  const maxRetries = Number.parseInt(process.env.MONGODB_CONNECT_RETRIES || '5', 10);
  const baseDelayMs = Number.parseInt(process.env.MONGODB_CONNECT_RETRY_DELAY_MS || '1500', 10);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      const message = error?.message || String(error);
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed: ${message}`);

      if (attempt >= maxRetries) {
        if (message.includes('querySrv') || message.includes('_mongodb._tcp')) {
          console.error(
            'Hint: This looks like a DNS/SRV lookup issue (mongodb+srv). Try a different network/DNS, or use a standard MongoDB connection string (mongodb://...) from Atlas.'
          );
        }
        process.exit(1);
      }

      const delayMs = baseDelayMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;
