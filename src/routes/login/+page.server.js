import { fail, redirect } from '@sveltejs/kit';
import { verify } from 'argon2';
import { connectToDatabase } from '$lib/server/dbconn';
import { JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies, request }) => {
		const data = await request.formData();

		const username = /** @type {string} */ (data.get('username'));
		const password = /** @type {string} */ (data.get('password'));

		const db = await connectToDatabase();

		const user = await db.collection('users').findOne({ username: username });
		if (!user) return fail(400, { username, incorrect: true });

		const valid = await verify(user.hash, password);
		if (!valid) return fail(400, { username, incorrect: true });

		const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '3d' });
		cookies.set('token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 2592000,
			path: '/'
		});

		return redirect(303, '/');
	}
};
