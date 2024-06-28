import { error, json } from '@sveltejs/kit';
import { collection, connectToDatabase } from '$lib/server/dbconn';
import { ObjectId } from 'mongodb';
import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';
import { generateSignedUrl } from '$lib/server/helpers';

const client = new S3Client({ region: 'eu-north-1' });

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const db = await connectToDatabase();

	const albumId = /** @type {string} */ (url.searchParams.get('albumId'));

	try {
		const data = await db
			.collection(collection)
			.find({ _id: ObjectId.createFromHexString(albumId) }, { projection: { images: 1 } })
			.toArray();
		return json(data, { status: 200 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const db = await connectToDatabase();

	const formData = await request.formData();

	const file = /** @type {File} */ (formData.get('file'));
	const albumId = /** @type {string} */ (formData.get('album'));

	const imageKey = crypto.randomUUID() + file.name;
	const fileStream = Buffer.from(await file.arrayBuffer());

	const command = new PutObjectCommand({
		Body: fileStream,
		ACL: 'public-read',
		Bucket: Bucket.bucket.bucketName,
		Key: imageKey
	});

	const response = await client.send(command);

	if (!response) {
		return error(500, 'Could not upload image');
	}

	const signedUrl = await generateSignedUrl(Bucket.bucket.bucketName, imageKey);
	const imageData = {
		imageName: formData.get('title'),
		imageText: formData.get('description'),
		urlExpiresIn: Date.now() + 3600000,
		imageUrl: signedUrl,
		imageKey: imageKey
	};

	try {
		const response = await db
			.collection(collection)
			.updateOne({ _id: ObjectId.createFromHexString(albumId) }, { $push: { images: imageData } });
		return json(response, { status: 201 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}

/**
 * @typedef {Object} Data
 * @property {string} [ imageName ]
 * @property {string} [ imageText ]
 * @property {string} [ imageKey ]
 * @property {string} [ imageUrl ]
 * @property {number} [ urlExpiresIn ]
 */

/**
 * @typedef {Object} updateDoc
 * @property {Data} $set
 */

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
	const db = await connectToDatabase();
	const body = await request.json();

	const bulkOperations = [];
	for (const data of body) {
		/** @type {updateDoc} */
		const updateDoc = {
			$set: {}
		};
		if (data.urlExpiresIn && data.urlExpiresIn < Date.now()) {
			data.imageUrl = await generateSignedUrl(Bucket.bucket.bucketName, data.imageKey);
			data.urlExpiresIn = Date.now() + 3600000;
		}
		for (const key in data) {
			updateDoc.$set[/** @type {keyof Data} */ (key)] = data[key];
		}
		// const signedUrl = await generateSignedUrl(Bucket.bucket.bucketName, d.albumKey, d.imageKey);
		// const updateDoc = {
		// 	$set: {
		// 		imageName: d.imageName,
		// 		imageText: d.imageText,
		// 		imageKey: d.imageKey,
		// 		imageUrl: signedUrl,
		// 		urlExpiresIn: Date.now() + 3600000
		// 	}
		// };
		bulkOperations.push({
			updateOne: {
				filter: {
					_id: ObjectId.createFromHexString(data.albumId),
					'images._id': ObjectId.createFromHexString(data.imageId)
				},
				update: updateDoc
			}
		});
	}

	try {
		const res = await db.collection(collection).bulkWrite(bulkOperations);
		return json(res);
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
	const db = await connectToDatabase();

	const body = await request.json();

	const command = new DeleteObjectCommand({
		Bucket: Bucket.bucket.bucketName,
		Key: body.imageKey
	});

	const response = await client.send(command);

	if (!response || response.$metadata.httpStatusCode !== 204) {
		return error(500, 'Could not delete image');
	}

	try {
		await db.collection(collection).deleteOne({ _id: ObjectId.createFromHexString(body.id) });
		return new Response(null, { status: 204 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}
