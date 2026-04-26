const mongoose = require('mongoose');
<<<<<<< HEAD

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
=======
const dns = require('dns');

const configureMongoDns = (mongoUri) => {
  if (!mongoUri || !mongoUri.startsWith('mongodb+srv://')) {
    return;
  }

  const configuredServers = process.env.MONGODB_DNS_SERVERS || '';
  const servers = configuredServers
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (!servers.length) {
    return;
  }

  try {
    dns.setServers(servers);
    console.log(`Using custom DNS servers for MongoDB SRV lookup: ${servers.join(', ')}`);
  } catch (error) {
    console.warn(`Failed to apply custom DNS servers: ${error.message}`);
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const mongoUriFallback = process.env.MONGODB_URI_FALLBACK;
>>>>>>> f2062aa (Initial commit: SmartLib project setup)
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not set');
    process.exit(1);
  }

<<<<<<< HEAD
=======
  configureMongoDns(mongoUri);

>>>>>>> f2062aa (Initial commit: SmartLib project setup)
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
<<<<<<< HEAD
        if (message.includes('querySrv') || message.includes('_mongodb._tcp')) {
          console.error(
            'Hint: This looks like a DNS/SRV lookup issue (mongodb+srv). Try a different network/DNS, or use a standard MongoDB connection string (mongodb://...) from Atlas.'
=======
        const isSrvLookupError = message.includes('querySrv') || message.includes('_mongodb._tcp');

        if (isSrvLookupError && mongoUriFallback) {
          try {
            console.log('Trying fallback MongoDB URI (MONGODB_URI_FALLBACK)...');
            const conn = await mongoose.connect(mongoUriFallback);
            console.log(`MongoDB Connected with fallback URI: ${conn.connection.host}`);
            return;
          } catch (fallbackError) {
            console.error(`Fallback MongoDB URI failed: ${fallbackError.message}`);
          }
        }

        if (isSrvLookupError) {
          console.error(
            'Hint: This looks like a DNS/SRV lookup issue (mongodb+srv). Set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 and/or provide MONGODB_URI_FALLBACK (mongodb://...) from Atlas.'
>>>>>>> f2062aa (Initial commit: SmartLib project setup)
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
