import { connectToDatabase, collection } from '$lib/server/dbconn';
import { error, json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, params }) {
	const db = await connectToDatabase();
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

		const res = await db.collection(collection).updateOne(filter, updateDoc);

		return json(res);
	} catch (/** @type {any}*/ e) {
		console.error(e);
		return error(500, e);
	}
}
