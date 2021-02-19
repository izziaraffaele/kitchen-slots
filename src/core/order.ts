import { IOrder } from './interfaces';

export const accept = (order: IOrder, processingTime: number): IOrder => ({
  ...order,
  processingTime,
  status: 'ACCEPTED',
});

export const reject = (order: IOrder): IOrder => ({
  ...order,
  status: 'REJECTED',
});

export const getIngredients = (order: IOrder) =>
  order.items
    .map((item) =>
      !item.includes('P') && !item.includes('V') ? item + 'P' : item
    )
    .join('')
    .split('')
    .reduce((carry, ingredient) => {
      if (!carry[ingredient]) {
        carry[ingredient] = 0;
      }

      carry[ingredient] += 1;
      return carry;
    }, {} as Record<string, number>);
