export function maskString(str: string, mask: string, n = 1) {
  return ('' + str).slice(0, -n).replace(/./g, mask) + ('' + str).slice(-n);
}

export function maskEmail(email: string) {
  if (!email || email === '' || !email.includes('@')) return '';

  const alias = email.split('@')[0];
  const domain = email.split('@')[1];

  const initialEmail = maskString(alias, '*', Math.floor(alias.length / 2));

  return `${initialEmail}@${domain}`;
}
