import { auth } from 'src/config';

export const contextAuthorizationMiddlware = async context => {
  const { req, connection } = context;
  if (connection) {
    return connection.context;
  } else if (req) {
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
      console.log(error.message);
      return { req };
    }
  }
};
