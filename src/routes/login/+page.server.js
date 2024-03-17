import { error, redirect } from '@sveltejs/kit'

/** @type {import('./$types').Actions} */
export const actions = {
  login: async ({ cookies, request }) => {
    const data = await request.formData()

    const username = data.get('username')
    const password = data.get('password')

    if (username === 'admin' && password === 'admin') {
      return redirect(302, '/');
    } else {
      return error(401, 'Virheellinen käyttäjätunnus tai salasana')
    }

  }
}
