import { ethers } from "ethers";

export const getHardhatProvider = () => {
  const hardhatRpcUrl = process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.providers.JsonRpcProvider(hardhatRpcUrl);
};
