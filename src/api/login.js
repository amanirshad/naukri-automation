import axios from 'axios';
import { loginHeaders } from '../utils/headers.js';
import { loginUrl } from '../utils/constants.js';

const extractCookieObject = (cookies = []) => {
  let unid = '';
  let nkwap = '';
  let nauk_at = '';
  let nauk_rt = '';
  let nauk_sid = '';

  for (const cookie of cookies) {
    if (cookie.startsWith('MYNAUKRI[UNID]=')) {
      unid = cookie.split(';')[0].split('=')[1];
    } else if (cookie.startsWith('NKWAP=')) {
      nkwap = cookie.split(';')[0].split('=')[1];
    } else if (cookie.startsWith('nauk_at=')) {
      nauk_at = cookie.split(';')[0].split('=')[1];
    } else if (cookie.startsWith('nauk_rt=')) {
      nauk_rt = cookie.split(';')[0].split('=')[1];
    } else if (cookie.startsWith('nauk_sid=')) {
      nauk_sid = cookie.split(';')[0].split('=')[1];
    }
  }

  return { unid, nkwap, nauk_at, nauk_rt, nauk_sid };
};

export const login = async (username, password) => {
  if (!username || !password) {
    throw new Error('NAUKRI_USERNAME and NAUKRI_PASSWORD must be set.');
  }

  const response = await axios.post(
    loginUrl,
    { username, password },
    {
      headers: loginHeaders,
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    }
  );

  const cookies = response.headers['set-cookie'];
  if (cookies) {
    return extractCookieObject(cookies);
  }

  console.warn('Cookie not found in login response.');
  return null;
};
