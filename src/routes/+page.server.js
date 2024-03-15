import { Bucket } from 'sst/node/bucket';
import { Api } from 'sst/node/api';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { error } from '@sveltejs/kit';

const client = new S3Client({});

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

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
  const response = await fetch(Api.mongoApi.url)

  if (!response.ok) {
    error(500, response.statusText)
  }

  /** @type Array.<{_id: string, imageName:string, imageUrl: string, imageText: string, imageKey: string, urlExpiresIn: number}> */
  const data = await response.json()

  if (!data) {
    return {
      imageData: []
    }
  }

  const ops = [];

  for (const d of data) {
    if (d.urlExpiresIn < Date.now()) {
      const signedUrl = await generateSignedUrl(Bucket.bucket.bucketName, d.imageKey)
      ops.push({ ...d, _id: d._id, imageUrl: signedUrl, urlExpiresIn: Date.now() + 3600000, })

      await fetch(Api.mongoApi.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ops)
      })
    }
  }

  return {
    imageData: data
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  upload: async ({ request }) => {
    const formData = await request.formData();
    const file = /** @type {File} */ (formData.get('file'))

    const fileStream = Buffer.from(await file.arrayBuffer());

    const imageKey = crypto.randomUUID() + file.name

    const command = new PutObjectCommand({
      Body: fileStream,
      ACL: 'public-read',
      Bucket: Bucket.bucket.bucketName,
      Key: imageKey
    })

    const response = await client.send(command);

    if (!response) return { success: false };

    const signedUrl = await generateSignedUrl(Bucket.bucket.bucketName, imageKey);
    const imageData = {
      imageName: formData.get('otsikko'),
      imageText: formData.get('kuvateksti'),
      urlExpiresIn: Date.now() + 3600000,
      imageUrl: signedUrl,
      imageKey: imageKey
    }

    const mongoResponse = await fetch(Api.mongoApi.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageData)
    })

    if (!mongoResponse.ok || mongoResponse.status !== 201) error(500, mongoResponse.statusText);

    return { success: true };
  }
}
