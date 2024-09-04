import axios  from "axios";

async function getExchangeRate(fromCurrency, toCurrency) {
  const url = `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`;
  try {
    const response = await axios.get(url);
    const rate = response.data.rates[toCurrency];
    return rate;
  } catch (error) {
    console.error(`Error fetching exchange rate: ${error}`);
    throw error;
  }
}
export default getExchangeRate;