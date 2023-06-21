export const isEnv = (env: 'DEVELOPMENT' | 'PRODUCTION') => {
  return process.env.NODE_ENV === env;
};
