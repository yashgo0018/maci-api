import deployedContracts from "./contracts/deployedContracts";
import scaffoldConfig from "./scaffold.config";
import { ethers } from "ethers";
import { createPublicClient, createWalletClient, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const chain = scaffoldConfig.targetNetworks[0];

export const publicClient = createPublicClient({ chain, transport: http() });

export const serverAccount = privateKeyToAccount(process.env.SERVER_PRIVATE_KEY as `0x${string}`);
export const serverWalletClient = createWalletClient({
  chain: chain,
  transport: http(),
  key: process.env.SERVER_PRIVATE_KEY,
  account: serverAccount,
});

export const maciWrapperContract = getContract({
  abi: deployedContracts[chain.id].MACIWrapper.abi,
  address: deployedContracts[chain.id].MACIWrapper.address,
  publicClient: publicClient,
  walletClient: serverWalletClient,
});

export const deploymentBlock = BigInt(deployedContracts[chain.id].MACIWrapper.deploymentBlockNumber);
export const ethersProvider = new ethers.JsonRpcProvider(chain.rpcUrls.default.http[0]);
