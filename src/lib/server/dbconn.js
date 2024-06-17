import { dev } from '$app/environment';
import { MONGODB_URI } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

/** @type {import('mongodb').Db | null} */
let cachedDb = null;
const dbName = dev ? 'Devbase' : 'Prodbase';

export const connectToDatabase = async () => {
	if (cachedDb) return cachedDb;

	const client = await MongoClient.connect(MONGODB_URI);

	cachedDb = client.db(dbName);

	if (!cachedDb) error(500, 'Could not connect to database');
	return cachedDb;
};

export const collection = dev ? 'Devdata' : 'ImageData';
