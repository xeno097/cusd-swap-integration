import axios from 'axios';

export enum ChainId {
  MAINNET = 1,
  POLYGON = 0,
  OPTIMISM = 10,
  ARBITRUM = 42161,
}

export interface _1inchApiProviderConfig {
  apiKey: string;
  network: ChainId;
}

function baseApiUrlFromNetwork(network: ChainId): string {
  return `https://api.1inch.dev/swap/v6.0/${network}`;
}

export interface ApprovalApiParams {
  tokenAddress: string;
  amount?: string;
}

export interface ApprovalResponse {
  data: string;
  gasPrice: string;
  to: string;
  value: string;
}

export interface SwapApiParams {
  src: string;
  dst: string;
  amount: string;
  from: string;
  slippage: number;
  disableEstimate: boolean;
}

export interface SwapResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: number;
  };
}

export class _1inchApiProvider {
  constructor(private readonly config: _1inchApiProviderConfig) {}

  public async getSwapTransactionData(
    params: SwapApiParams,
  ): Promise<SwapResponse> {
    const response = await axios.get<SwapResponse>(
      `${baseApiUrlFromNetwork(this.config.network)}/swap`,
      {
        params,
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      },
    );

    return response.data;
  }

  public async getApprovalTransactionData(
    params: ApprovalApiParams,
  ): Promise<ApprovalResponse> {
    const response = await axios.get<ApprovalResponse>(
      `${baseApiUrlFromNetwork(this.config.network)}/approve/transaction`,
      {
        params,
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      },
    );

    return response.data;
  }
}
