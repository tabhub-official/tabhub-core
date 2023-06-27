import { Logger } from '@nestjs/common';
import { auth } from 'src/config';

export const contextAuthorizationMiddlware = async context => {
  const { req, connection } = context;
  if (connection) {
    return connection.context;
  } else if (req) {
    try {
      const regex = /Bearer (.+)/i;
      const authorizationToken = req.headers['authorization'];
      if (authorizationToken) {
        const idToken = authorizationToken.match(regex)?.[1];
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
      new Logger('MIDDLEWARE').error(error.message);
      return { req };
    }
  }
};
