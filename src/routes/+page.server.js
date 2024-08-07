import { generateSignedUrl } from '$lib/server/helpers';
import { error } from '@sveltejs/kit';
import { Bucket } from 'sst/node/bucket';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	const response = await fetch('/api/albums');

	/** @type {import('$lib/customTypes').album[]} */
	const data = await response.json();

	if (!data) {
		return {
			albumData: []
		};
	}

	const ops = [];

	for (const d of data) {
		const imageData = await fetch(`/api/images/${d.coverPhoto}?albumId=${d._id}`);
		const image = await imageData.json();

		if (image.urlExpiresIn < Date.now()) {
			const signedUrl = await generateSignedUrl(Bucket.bucket.bucketName, image.imageKey);
			ops.push({
				imageId: image._id,
				albumId: d._id,
				albumKey: d.name,
				imageKey: image.imageKey,
				imageUrl: signedUrl,
				urlExpiresIn: Date.now() + 3600000
			});
		}
	}

	if (ops.length > 0) {
		await fetch('/api/images', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(ops)
		});
	}

	return {
		albumData: data
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();

		const mongoResponse = await fetch('/api/images', {
			method: 'POST',
			body: formData
		});

		if (!mongoResponse.ok || mongoResponse.status !== 201) error(500, mongoResponse.statusText);

		return { success: true };
	}
};
