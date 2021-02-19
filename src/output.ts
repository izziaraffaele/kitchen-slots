import { IIngredients, IOrder } from './core/interfaces';
import { Ingredients } from './constants';

export interface Response {
  merchant: string;
  total: number;
  inventory: IIngredients;
  orders: IOrder[];
}

export const send = (data: Response) => {
  const rows: string[] = [];

  data.orders.forEach((order) => {
    rows.push(
      [order.merchantId, order.id, order.status, order.processingTime].join(',')
    );
  });

  rows.push([data.merchant, 'TOTAL', data.total].join(','));

  rows.push(
    [
      data.merchant,
      'INVENTORY',
      data.inventory[Ingredients.Patty],
      data.inventory[Ingredients.Lattuce],
      data.inventory[Ingredients.Tomato],
      data.inventory[Ingredients.VeganPatty],
      data.inventory[Ingredients.Bacon],
    ].join(',')
  );

  rows.push('\n');

  console.log(rows.join('\n'));
};
