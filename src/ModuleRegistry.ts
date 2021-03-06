import Web3 from 'web3';
import { ModuleRegistryAbi } from './abis/ModuleRegistryAbi';
import { Contract } from './Contract';
import { IContext } from './PolymathAPI';
import { TransactionObject } from 'web3/eth/types';
import { ModuleFactory } from './ModuleFactory';
import { ModuleTypes, IGenericContract } from './types';

// This type should be obtained from a library (must match ABI)
interface IModuleRegistryContract extends IGenericContract {
  methods: {
    getModulesByTypeAndToken(
      moduleType: number,
      tokenAddress: string,
    ): TransactionObject<string[]>;
  };
}

export class ModuleRegistry extends Contract<IModuleRegistryContract> {
  constructor({ address, context }: { address: string; context: IContext }) {
    super({ address, abi: ModuleRegistryAbi.abi, context });
  }

  public async getModulesByTypeAndToken(
    moduleType: ModuleTypes,
    tokenAddress: string,
  ) {
    return this.contract.methods
      .getModulesByTypeAndToken(moduleType, tokenAddress)
      .call();
  }

  /**
   * Retrieve a compatible module's factory address for a given
   * security token
   *
   * @throws an error if there is no compatible module with that name
   */
  public async getModuleFactoryAddress(
    moduleName: string,
    moduleType: ModuleTypes,
    tokenAddress: string,
  ) {
    const availableModules = await this.getModulesByTypeAndToken(
      moduleType,
      tokenAddress,
    );

    for (const moduleAddress of availableModules) {
      const moduleFactory = new ModuleFactory({
        address: moduleAddress,
        context: this.context,
      });

      const name = Web3.utils.toAscii(await moduleFactory.name());

      if (name === moduleName) {
        return moduleAddress;
      }
    }

    throw new Error(`Module factory for "${moduleName}" was not found.`);
  }
}
