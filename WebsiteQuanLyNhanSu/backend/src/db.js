import mongoose from 'mongoose';
import { config } from './config.js';
import { registerModels } from './models/schemas.js';

export async function connectDb() {
  try {
    registerModels();
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri);
    console.log('[db] Connected to MongoDB');
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    console.error('[db] Please ensure MongoDB is running on', config.mongoUri);
    throw err;
  }
}
