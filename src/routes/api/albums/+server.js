import { collectionName, connectToDatabase } from '$lib/server/dbconn';
import { error, json } from '@sveltejs/kit';

const db = await connectToDatabase();
const collection = db.collection(collectionName);

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const data = await collection.find({}, { projection: { images: 0 } }).toArray();
		return json(data, { status: 200 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	//TODO: Implement album creation
	return error(501, 'Not implemented');
}
