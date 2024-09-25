// utils/shortenBalance.js

export const shortenBalance = (balance, decimals = 4) => {
    if (!balance) return '0';
    
    // Convert balance to a number and round to the specified number of decimals
    const shortenedBalance = parseFloat(balance).toFixed(decimals);
    
    return `${shortenedBalance}`;
  };
  