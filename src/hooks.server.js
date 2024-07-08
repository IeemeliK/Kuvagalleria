import { JWT_SECRET } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

/**
 * @typedef JwtPayload
 * @property {string} user
 */

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
	const token = event.cookies.get('user');

	if (!token && event.url.pathname !== '/login') {
		if (event.url.pathname.startsWith('/api')) {
			return error(401, 'Unauthorized');
		}
		event.locals.user = null;
		throw redirect(302, '/login');
	}

	if (token) {
		let decoded;
		try {
			decoded = /** @type {JwtPayload} */ (jwt.verify(token, JWT_SECRET));
		} catch (error) {
			event.cookies.delete('user', { path: '/' });
			event.locals.user = null;
			throw redirect(302, '/login');
		}
		event.locals.user = decoded.user;
	}

	const response = await resolve(event);
	return response;
};
