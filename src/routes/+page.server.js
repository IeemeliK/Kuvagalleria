import { Bucket } from 'sst/node/bucket';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

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

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, fetch }) {
  const token = cookies.get('token');
  if (!token) return redirect(302, '/login');

  const verified = jwt.verify(token, JWT_SECRET);
  if (!verified) {
    cookies.delete('token', { path: '/' });
    return redirect(302, '/login');
  }
  const response = await fetch('/api/images')

  /** @type {import('$lib/customTypes').ImageData[]} */
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
      d.imageUrl = signedUrl;
      d.urlExpiresIn = Date.now() + 3600000;
      ops.push(d);
    }
  }

  if (ops.length > 0) {
    await fetch('/api/images', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ops)
    })
  }

  return {
    imageData: data
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  upload: async ({ request, fetch }) => {
    const formData = await request.formData();

    const mongoResponse = await fetch('/api/images', {
      method: 'POST',
      body: formData,
    })

    if (!mongoResponse.ok || mongoResponse.status !== 201) error(500, mongoResponse.statusText);

    return { success: true };
  },
}
