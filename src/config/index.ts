import * as dotenv from 'dotenv';
import * as joi from 'joi';

dotenv.config();

type AppConfigOptions = {
  _1InchApiKey: string;
  rpcUrl: string;
  privateKey: string;
};

const appConfigValidationSchema = joi.object<AppConfigOptions>({
  _1InchApiKey: joi.string().not().empty().exist(),
  rpcUrl: joi.string().uri().exist(),
  privateKey: joi.string().exist(),
});

export class AppConfig {
  readonly oxApiKey: string;
  readonly rpcUrl: string;
  readonly privateKey: string;

  constructor({
    _1InchApiKey: oxApiKey,
    rpcUrl,
    privateKey,
  }: AppConfigOptions) {
    this.oxApiKey = oxApiKey;
    this.rpcUrl = rpcUrl;
    this.privateKey = privateKey;
  }

  static FromEnv(): AppConfig {
    const options: AppConfigOptions = {
      _1InchApiKey: process.env['_1INCH_API_KEY']!,
      rpcUrl: process.env['RPC_PROVIDER_URL']!,
      privateKey: process.env['ACCOUNT_PRIVATE_KEY']!,
    };

    const validationResult = appConfigValidationSchema.validate(options, {
      allowUnknown: false,
    });

    if (validationResult.error) {
      throw validationResult.error;
    }

    return new AppConfig(options);
  }
}
