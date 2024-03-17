import { dev } from '$app/environment';
import { MONGODB_URI } from '$env/static/private';
import { MongoClient } from 'mongodb';

/** @type {import('mongodb').Db | null} */
let cachedDb = null;
const dbName = dev ? 'Devbase' : 'Images'

export const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(MONGODB_URI);

  cachedDb = client.db(dbName);
  return cachedDb;
}

export const collection = dev ? 'Devdata' : 'ImageData';
