import { TOKEN_CONFIG } from '@/config/env';

export interface LocalTokenUser {
  id: string;
  username?: string;
  email?: string;
  roleId?: string;
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createLocalTokenPair(user: LocalTokenUser): {
  accessToken: string;
  refreshToken: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      iat: now,
      exp: now + TOKEN_CONFIG.ACCESS_TOKEN_VALIDITY_HOURS * 60 * 60,
    })
  );
  const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const token = `${header}.${payload}.local-demo`;

  return { accessToken: token, refreshToken: token };
}
