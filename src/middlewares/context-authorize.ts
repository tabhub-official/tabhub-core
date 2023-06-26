import { auth } from 'src/config';

export const contextAuthorizationMiddlware = async context => {
  let req = context.req;
  if (context.connection) {
    req = context.connection.context.req;
  }
  try {
    const regex = /Bearer (.+)/i;
    if (req.headers['authorization']) {
      const idToken = req.headers['authorization'].match(regex)?.[1];
      if (idToken) {
        const token = await auth.verifyIdToken(idToken);
        req.user = {
          id: token.uid,
          email: token.email,
          phone: token.phone_number,
          picture: token.picture,
        };
      }
    }
    return { ...context, req };
  } catch (error) {
    console.log(error);
    return { req };
  }
};
