import { error, json } from '@sveltejs/kit';
import { collectionName, connectToDatabase } from '$lib/server/dbconn';
import { ObjectId, Collection } from 'mongodb';
import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';
import { generateSignedUrl } from '$lib/server/helpers';

const client = new S3Client({ region: 'eu-north-1' });
const db = await connectToDatabase();

/** @type Collection<import('$lib/customTypes').album[]> */
const collection = db.collection(collectionName);

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const albumId = /** @type {string} */ (url.searchParams.get('albumId'));

	try {
		const data = await collection
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
		imageKey: imageKey,
		createdAt: Date.now()
	};

	try {
		const response = await collection.findOneAndUpdate(
			{ _id: ObjectId.createFromHexString(albumId) },
			{ $push: { images: imageData } }
		);
		return json(response, { status: 201 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
	const body = await request.json();

	/** @type {import('mongodb').AnyBulkWriteOperation<any>[]} */
	const bulkOperations = [];
	for (const data of body) {
		const updateDoc = {
			/** @type {Partial<import('$lib/customTypes').album>} */
			$set: {}
		};
		for (const key in data) {
			updateDoc.$set[/** @type {keyof import('$lib/customTypes').album} */ (key)] = data[key];
		}

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
		const res = await collection.bulkWrite(bulkOperations);
		return json(res);
	} catch (/** @type {any} */ e) {
		console.error(e);
		return error(500, e);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
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
		await collection.findOneAndDelete({ _id: ObjectId.createFromHexString(body.id) });
		return new Response(null, { status: 204 });
	} catch (/** @type {any} */ e) {
		console.error(e);
		throw error(500, e);
	}
}
