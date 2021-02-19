import sortBy from 'lodash/sortBy';

import { IWorkstation, IOrder, IIngredients } from './interfaces';
import * as Order from './order';
import * as Inventory from './inventory';
import * as Queue from './queue';

export const processOrders = (
  inventory: Inventory.Inventory,
  queue: Queue.Queue,
  orders: IOrder[]
) => {
  return sortBy(orders, 'date').map((order) => {
    const ingredients = Order.getIngredients(order);

    if (!inventory.has(ingredients)) {
      return Order.reject(order);
    }

    inventory.pop(ingredients);

    const processingTime = queue.estimate(order);

    if (processingTime > 20) {
      return Order.reject(order);
    }

    queue.schedule(order);
    return Order.accept(order, processingTime);
  });
};

export const create = (
  inventory: IIngredients,
  workstations: IWorkstation[]
) => {
  const stock = Inventory.create(inventory);
  const queue = Queue.create({ workstations });

  return {
    process: (orders: IOrder[]) => processOrders(stock, queue, orders),
    getInventory: () => stock.getState(),
    getTotalProcessingTime: () => queue.getTotalProcessingTime(),
  };
};
