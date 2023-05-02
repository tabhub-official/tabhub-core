import { AuthUser } from 'src/middlewares';

export const getAuthUser = (req: any): AuthUser => {
  const user = req.user;
  if (!user) throw new Error('User is not authenticated');
  return user;
};
