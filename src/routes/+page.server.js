import { Bucket } from 'sst/node/bucket';
import { Api } from 'sst/node/api';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({});

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
  const response = await fetch(Api.mongoApi.url)


  if (!response.ok) {
    throw new Error(response.statusText);
  }

  /** @type Array.<{_id: string, imageName:string, imageUrl: string, imageText: string, imageKey: string, urlExpiresIn: number}> */
  const data = await response.json()

  // TODO: update url in mongo
  for (const d of data) {
    if (d.urlExpiresIn < Date.now()) {
      const command = new GetObjectCommand({
        Bucket: Bucket.bucket.bucketName,
        Key: d.imageKey
      })
      await getSignedUrl(client, command, { expiresIn: 3600 });
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

    const response = await getSignedUrl(client, command, { expiresIn: 3600 });

    const imageData = {
      imageName: formData.get('otsikko'),
      imageText: formData.get('kuvateksti'),
      urlExpiresIn: Date.now() + 3600000,
      imageUrl: response,
      imageKey: imageKey
    }

    const response2 = await fetch(Api.mongoApi.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageData)
    })

    console.log(response2)

    if (!response || response.$metadata.httpStatusCode != 200) return { success: false };

    return { success: true };
  }
}
