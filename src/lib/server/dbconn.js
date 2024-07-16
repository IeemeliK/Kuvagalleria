import { dev } from '$app/environment';
import { MONGODB_URI } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

/** @type {import('mongodb').Db | null} */
let db;

/** @type {import('mongodb').MongoClient | null} */
let client;
const dbName = dev ? 'Devbase' : 'Prodbase';

export const connectToDatabase = async () => {
	if (db) return db;

	client = await MongoClient.connect(MONGODB_URI);
	db = client.db(dbName);
	if (!db) error(500, 'Could not connect to database');
	return db;
};

export const collectionName = dev ? 'Devdata' : 'ImageData';
