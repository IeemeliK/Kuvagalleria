<script>
	/** @type {import('./$types').PageServerData} */
	export let data;
</script>

<section>
	<form method="POST" enctype="multipart/form-data" action="?/upload">
		<label for="otsikko">Otsikko</label>
		<input name="otsikko" type="text" />
		<label for="kuvateksti">Kuvateksti</label>
		<input name="kuvateksti" type="text" />
		<input name="file" type="file" accept="image/png, image/jpeg" multiple />
		<button type="submit">Upload</button>
	</form>
</section>

{#each data.imageData as image (image.imageKey)}
	<h1>{image.imageName}</h1>
	<p>{image.imageText}</p>
	<img src={image.imageUrl} alt={image.imageName} height="200px" />
{:else}
	<p>Ei kuvia</p>
{/each}
