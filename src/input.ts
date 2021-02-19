import fs from 'fs';
import trimEnd from 'lodash/trimEnd';
import chunk from 'lodash/chunk';

import { Ingredients } from './constants';

const inventoryKeyMap = [
  Ingredients.Patty,
  Ingredients.Lattuce,
  Ingredients.Tomato,
  Ingredients.VeganPatty,
  Ingredients.Bacon,
];

const parseString = (input: string) => {
  const [firstRow, ...otherRows] = trimEnd(input, '\n')
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim()));

  if (!firstRow) {
    throw new Error('INVALID_INPUT');
  }

  const merchant = {
    id: firstRow[0],
    workstations: chunk(firstRow.slice(1, 7), 2).map(([capacity, time]) => ({
      id: capacity[1],
      capacity: parseInt(capacity[0], 10),
      time: parseInt(time, 10),
    })),
    inventory: firstRow.slice(7).reduce((carry, item, index) => {
      const itemId = inventoryKeyMap[index];
      carry[itemId] = parseInt(item, 10);
      return carry;
    }, {} as Record<string, number>),
  };

  const orders = otherRows.map(([merchantId, date, id, ...items]) => ({
    id,
    merchantId,
    date: new Date(date),
    items: items,
  }));

  return { merchant, orders };
};

const parseSource = (source: string) => {
  if (fs.existsSync(source)) {
    return parseString(fs.readFileSync(source).toString());
  }
};

export default { parseSource, parseString };
