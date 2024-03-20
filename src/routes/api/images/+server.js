import { error, json } from '@sveltejs/kit';
import { collection, connectToDatabase } from '$lib/server/dbconn';
import { ObjectId } from 'mongodb';
import { PutObjectCommand, GetObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({ region: 'eu-north-1' });

/** 
 * @param {string} bucket The name of the bucket
 * @param {string} key The key of the object
 * @returns {Promise<string>} The signed URL
 */
const generateSignedUrl = async (bucket, key) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  })
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return signedUrl;
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  const db = await connectToDatabase();

  try {
    const data = await db.collection(collection).find({}).toArray();
    return json(data, { status: 200 });
  } catch (/** @type {any} */e) {
    console.error(e)
    return error(500, e)
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  const db = await connectToDatabase();

  const formData = await request.formData();

  const file = /** @type {File} */(formData.get('file'))

  const imageKey = crypto.randomUUID() + file.name;
  const fileStream = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Body: fileStream,
    ACL: 'public-read',
    Bucket: Bucket.bucket.bucketName,
    Key: imageKey
  })

  const response = await client.send(command);

  if (!response) {
    return error(500, 'Could not upload image')
  }

  const signedUrl = await generateSignedUrl(Bucket.bucket.bucketName, imageKey);
  const imageData = {
    imageName: formData.get('otsikko'),
    imageText: formData.get('kuvateksti'),
    urlExpiresIn: Date.now() + 3600000,
    imageUrl: signedUrl,
    imageKey: imageKey
  }

  try {
    const response = await db.collection(collection).insertOne(imageData);
    return json(response, { status: 201 });
  } catch (/** @type {any} */e) {
    console.error(e)
    return error(500, e)
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
  const db = await connectToDatabase();
  const body = await request.json();

  const bulkOperations = [];
  for (const d of body) {
    const updateDoc = {
      $set: {
        imageName: d.imageName,
        imageText: d.imageText,
        imageKey: d.imageKey,
        imageUrl: d.imageUrl,
        urlExpiresIn: d.urlExpiresIn
      }
    }
    bulkOperations.push({ updateOne: { filter: { _id: ObjectId.createFromHexString(d._id) }, update: updateDoc } });
  }

  try {
    const res = await db.collection(collection).bulkWrite(bulkOperations);
    return json(res);
  } catch (/** @type {any} */e) {
    console.error(e)
    return error(500, e)
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  const db = await connectToDatabase();

  const body = await request.json();

  const command = new DeleteObjectCommand({
    Bucket: Bucket.bucket.bucketName,
    Key: body.imageKey
  })

  const response = await client.send(command);

  if (!response || response.$metadata.httpStatusCode !== 204) {
    return error(500, 'Could not delete image')
  }

  try {
    await db.collection(collection).deleteOne({ _id: ObjectId.createFromHexString(body.id) });
    return new Response(null, { status: 204 });
  } catch (/** @type {any} */e) {
    console.error(e)
    return error(500, e)
  }
}
