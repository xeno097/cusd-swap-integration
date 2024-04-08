import {
  Hex,
  createWalletClient,
  erc20Abi,
  getContract,
  http,
  publicActions,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import { ChainId, _1inchApiProvider, _1inchApiProviderConfig } from './1-inch';
import { AppConfig } from './config';

const cUSDC_TOKEN_ADDRESS = '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf';
const USDC_TOKEN_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

async function main(): Promise<void> {
  const appConfig = AppConfig.FromEnv();

  const buyToken = cUSDC_TOKEN_ADDRESS;
  const sellToken = USDC_TOKEN_ADDRESS;

  const wallet = createWalletClient({
    transport: http(appConfig.rpcUrl),
    account: privateKeyToAccount(appConfig.privateKey as Hex),
    chain: arbitrum,
  }).extend(publicActions);

  const [senderAddress] = await wallet.getAddresses();

  const readonlyNativeUSDCContractInstance = getContract({
    address: sellToken as Hex,
    abi: erc20Abi,
    client: wallet,
  });

  const sellTokenAmount =
    await readonlyNativeUSDCContractInstance.read.balanceOf([senderAddress!]);

  const _1InchProviderConfig: _1inchApiProviderConfig = {
    apiKey: appConfig.oxApiKey,
    network: ChainId.ARBITRUM,
  };

  const _1inchProvider = new _1inchApiProvider(_1InchProviderConfig);

  // Approve the 1Inch router to move funds on behalf of the user
  const approvalTransactionData =
    await _1inchProvider.getApprovalTransactionData({
      tokenAddress: sellToken,
    });

  const approvalTransactionHash = await wallet.sendTransaction({
    to: approvalTransactionData.to as Hex,
    data: approvalTransactionData.data as Hex,
  });

  console.info(
    `Approval transaction sent. Tx hash: ${approvalTransactionHash}`,
  );

  const approvalTransctionReceipt = await wallet.waitForTransactionReceipt({
    hash: approvalTransactionHash,
  });

  if (approvalTransctionReceipt.status === 'reverted') {
    throw new Error(
      `Approval Transaction Failed. Transaction hash ${approvalTransactionHash}`,
    );
  }

  console.info('Approval transaction completed');

  // Execute the swap
  const swapResponse = await _1inchProvider.getSwapTransactionData({
    dst: buyToken,
    src: sellToken,
    amount: sellTokenAmount.toString(),
    from: senderAddress!,
    slippage: 5,
    disableEstimate: true,
  });

  const swapTransactionHash = await wallet.sendTransaction({
    to: swapResponse.tx.to as Hex,
    data: swapResponse.tx.data as Hex,
  });

  console.info(`Swap transaction sent. Tx hash: ${swapTransactionHash}`);

  const swapTransctionReceipt = await wallet.waitForTransactionReceipt({
    hash: swapTransactionHash,
  });

  if (swapTransctionReceipt.status === 'reverted') {
    throw new Error(
      `Swap Transaction Failed. Transaction hash ${swapTransactionHash}`,
    );
  }

  console.info('Swap transaction completed');
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
