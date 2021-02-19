import sortBy from 'lodash/sortBy';

import { IWorkstation, IOrder, IIngredients } from './interfaces';
import * as Order from './order';
import * as Inventory from './inventory';
import * as Queue from './queue';

export const processOrders = (
  inventory: IIngredients,
  queue: Queue.Queue,
  orders: IOrder[]
) => {
  return sortBy(orders, 'date').map((order) => {
    const ingredients = Order.getIngredients(order);

    if (!Inventory.hasIngredients(inventory, ingredients)) {
      return Order.reject(order);
    }

    Inventory.popIngredients(inventory, ingredients);
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
  const queue = Queue.create({ workstations });

  return {
    process: (orders: IOrder[]) => processOrders(inventory, queue, orders),
    getInventory: () => inventory,
    getTotalProcessingTime: () => queue.getTotalProcessingTime(),
  };
};
