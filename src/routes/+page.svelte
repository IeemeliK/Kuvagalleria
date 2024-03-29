<script>
	import { enhance } from '$app/forms';

	/** @type {import('./$types').PageServerData} */
	export let data;

	/** @param {import('$lib/customTypes').ImageData} image */
	const deleteImage = async (image) => {
		const confirmDelete = confirm(`Haluatko varmasti poistaa kuvan ${image.imageName}?`);
		if (!confirmDelete) return;

		const deletionData = {
			id: image._id,
			imageKey: image.imageKey
		};
		const response = await fetch('api/images/', {
			method: 'DELETE',
			body: JSON.stringify(deletionData)
		});
		if (response.ok) {
			data.imageData = data.imageData.filter((i) => i.imageKey !== image.imageKey);
		}
	};
</script>

<section>
	<form method="POST" use:enhance enctype="multipart/form-data">
		<label for="otsikko">Otsikko</label>
		<input name="otsikko" type="text" />
		<label for="kuvateksti">Kuvateksti</label>
		<input name="kuvateksti" type="text" />
		<input name="file" type="file" accept="image/*" />
		<button type="submit">Upload</button>
	</form>
</section>

{#each data.imageData as image (image.imageKey)}
	<h1>{image.imageName}</h1>
	<p>{image.imageText}</p>
	<img src={image.imageUrl} alt={image.imageName} height="200px" />
	<button type="button" on:click={() => deleteImage(image)}>Poista</button>
{:else}
	<p>Ei kuvia</p>
{/each}
