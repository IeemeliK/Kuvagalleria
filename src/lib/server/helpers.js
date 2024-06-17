import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({ region: 'eu-north-1' });

/**
 * @param {string} bucket The name of the bucket
 * @param {string} key The key of the object
 * @param {string} album album key (path) of the object
 * @returns {Promise<string>} The signed URL
 */
export const generateSignedUrl = async (bucket, album, key) => {
	const command = new GetObjectCommand({
		Bucket: bucket,
		Key: `${album}/${key}`
	});
	const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

	return signedUrl;
};
