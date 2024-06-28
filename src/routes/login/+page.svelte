<script>
import { enhance } from '$app/forms';
export let form;
</script>

<form method="POST" use:enhance>
	<label>
		Käyttäjätunnus
		<input name="username" type="text" value={form?.username ?? ''} />
	</label>
	<label>
		Salasana
		<input name="password" type="password" />
	</label>
	<button type="submit">Kirjaudu</button>
	{#if form?.incorrect}
		<small class="error">Väärä käyttäjätunnus tai salasana</small>
	{/if}
</form>
