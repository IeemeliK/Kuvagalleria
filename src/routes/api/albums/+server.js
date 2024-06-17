import { collection, connectToDatabase } from '$lib/server/dbconn';
import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const db = await connectToDatabase();

	try {
		const data = await db
			.collection(collection)
			.find({}, { projection: { images: 0 } })
			.toArray();
		return json(data, { status: 200 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}
