import { connectToDatabase, collectionName } from '$lib/server/dbconn';
import { error, json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';

const db = await connectToDatabase();
const collection = db.collection(collectionName);

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, params }) {
	const body = await request.json();
	const filter = { _id: ObjectId.createFromHexString(params.id) };
	const updateDoc = {
		/** @type {Record<string, any>} */
		$set: {}
	};

	for (const [key, value] of Object.entries(body)) {
		updateDoc.$set[key] = value;
	}

	try {
		const res = await collection.updateOne(filter, updateDoc);
		return json(res, { status: 200 });
	} catch (/** @type {any}*/ e) {
		console.error(e);
		return error(500, e);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, url }) {
	const albumId = /** @type {string} */ (url.searchParams.get('albumId'));

	try {
		const data = await collection.findOne({
			_id: ObjectId.createFromHexString(albumId),
			'images._id': ObjectId.createFromHexString(params.id)
		});
		return json(data, { status: 200 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}
