import crypto from 'crypto';

function generateTempPassword(length = 12) {
  return crypto.randomBytes(length)
    .toString('base64')
    .slice(0, length)
    .replace(/[+/]/g, '');
}

function generateSixDigitNumber() {
  const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  return randomNumber;
}
export { generateTempPassword, generateSixDigitNumber }