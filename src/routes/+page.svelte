<script>
import { enhance } from '$app/forms';

/** @type {import('./$types').PageServerData} */
export let data;

// /** @param {import('$lib/customTypes').ImageData} image */
// const deleteImage = async (image) => {
// 	const confirmDelete = confirm(`Haluatko varmasti poistaa kuvan ${image.imageName}?`);
// 	if (!confirmDelete) return;
//
// 	const deletionData = { id: image._id,
// 		imageKey: image.imageKey
// 	};
// 	const response = await fetch('api/images/', {
// 		method: 'DELETE',
// 		body: JSON.stringify(deletionData)
// 	});
// 	if (response.ok) {
// 		data.imageData = data.imageData.filter((i) => i.imageKey !== image.imageKey);
// 	}
// };
</script>

<section>
	<form method="POST" use:enhance enctype="multipart/form-data">
		<label for="title">Otsikko</label>
		<input name="title" type="text" />
		<label for="description">Kuvateksti</label>
		<input name="description" type="text" />
		<label for="album">Albumi</label>
		<select name="album" id="album">
			<option value="">Valitse albumi</option>
			{#each data.albumData as album}
				<option value={album._id}>{album.name}</option>
			{/each}
		</select>
		<input name="file" type="file" accept="image/*" />
		<button type="submit">Upload</button>
	</form>
</section>

