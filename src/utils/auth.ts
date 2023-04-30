export const getAuthUser = (req: any) => {
  const user = req.user;
  if (!user) throw new Error('User is not authenticated');
  return user;
};
