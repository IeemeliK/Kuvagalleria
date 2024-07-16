import { connectToDatabase, collectionName } from '$lib/server/dbconn';
import { error, json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';

const db = await connectToDatabase();
const collection = db.collection(collectionName);

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, params }) {
	const body = await request.json();

	try {
		const filter = { _id: ObjectId.createFromHexString(params.id) };
		const updateDoc = {
			$set: {
				imageName: body.imageName,
				imageText: body.imageText,
				imageKey: body.imageKey,
				imageUrl: body.imageUrl,
				urlExpiresIn: body.urlExpiresIn
			}
		};

		const res = await collection.updateOne(filter, updateDoc);

		return json(res);
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
		return json(data);
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}
