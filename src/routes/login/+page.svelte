<script>
	import { enhance } from '$app/forms';
	export let form;
</script>

<form method="POST" use:enhance action="?/login">
	<label for="username">Käyttäjätunnus</label>
	<input name="username" type="text" />
	<label for="password">Salasana</label>
	<input name="password" type="password" />
	<button type="submit">Kirjaudu</button>
	<small>{form?.error}</small>
</form>
