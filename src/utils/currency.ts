export const getInSoles = (
  price: number,
  exchangeRate: number,
  currency?: string,
) => {
  if (currency === "$") return price * exchangeRate;
  return price;
};

export const getBaseUnit = (unitStr: string) => {
  if (unitStr === "gr" || unitStr === "kg") return "kg";
  if (unitStr === "ml" || unitStr === "L") return "L";
  return "un";
};

export const getNormalizedPrice = (
  price: number,
  quantity: number,
  unitStr: string,
  exchangeRate: number,
  currencyStr?: string,
  presentation?: number,
) => {
  if (price === 0) return 0;
  let priceInSoles = getInSoles(price, exchangeRate, currencyStr);
  let pricePerBaseUnit = priceInSoles;

  if (unitStr !== "un") {
    const amount = presentation || quantity;
    if (amount > 0) {
      pricePerBaseUnit = priceInSoles / amount;
      if (unitStr === "gr" || unitStr === "ml")
        pricePerBaseUnit = pricePerBaseUnit * 1000;
    }
  }
  return pricePerBaseUnit;
};
