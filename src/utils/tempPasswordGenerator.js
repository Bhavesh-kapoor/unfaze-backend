import crypto from 'crypto';

function generateTempPassword(length = 12) {
  return crypto.randomBytes(length)
    .toString('base64')  
    .slice(0, length)    
    .replace(/[+/]/g, '');
}
export {generateTempPassword}