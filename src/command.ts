import yargs = require('yargs');

import Input from './input';
import * as Merchant from './core/merchant';
import * as Output from './output';

interface Arguments extends yargs.Arguments {
  source: string;
}

export const command = ['run <source>', '$0'];

export const desc = 'Run the process';

export const builder = (yargs: any) => {
  yargs.positional('source', {
    type: 'string',
    describe: 'the relative path to the file containing input data',
  });
};

export const handler = function (argv: Arguments) {
  const input = Input.parseSource(argv.source);

  if (!input?.merchant) {
    throw new Error('Invalid input');
  }

  const merchant = Merchant.create(
    input.merchant.inventory,
    input.merchant.workstations
  );

  const processedOrders = merchant.process(
    input.orders.map((order) => ({
      ...order,
      status: 'PENDING',
      processingTime: 0,
    }))
  );

  Output.send({
    merchant: input.merchant.id,
    orders: processedOrders,
    inventory: merchant.getInventory(),
    total: merchant.getTotalProcessingTime(),
  });
};
