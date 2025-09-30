export const load = async ({locals, request}) => {
    const session = await locals.auth.api.getSession({
        headers: request.headers
    });

    return {
        session
    };
};