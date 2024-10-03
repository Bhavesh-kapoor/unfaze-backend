import { Cashfree } from "cashfree-pg";
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;

if (process.env.DEV_MODE == "prod") {
    Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
} else {
    Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
}

export default Cashfree;

// export const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
// export const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
// export const CASHFREE_ENV = process.env.CASHFREE_ENV || 'TEST';

// export const BASE_URL = CASHFREE_ENV === 'PROD'
//     ? 'https://api.cashfree.com'
//     : 'https://sandbox.cashfree.com';