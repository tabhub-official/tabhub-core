import slugify from 'slugify';

export function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export function buildSlug(name: string, nonceHidden?: boolean) {
  return `${slugify(name as string, {
    lower: true,
    strict: true,
    trim: true,
  })}${nonceHidden ? `` : `-${makeid(5)}`}`;
}
