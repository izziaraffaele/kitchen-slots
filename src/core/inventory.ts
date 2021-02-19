import merge from 'lodash/merge';
import { IIngredients } from './interfaces';

export interface Inventory {
  getState(): IIngredients;
  has(ingredients: IIngredients): boolean;
  pop(ingredients: IIngredients): void;
}

export const hasIngredients = (
  stock: IIngredients,
  ingredients: IIngredients
) => {
  return Object.keys(ingredients).every((key) => {
    return stock[key] && stock[key] > ingredients[key];
  });
};

export const popIngredients = (
  stock: IIngredients,
  ingredients: IIngredients
) => {
  return Object.keys(ingredients).reduce((carry, key) => {
    return merge(carry, { [key]: carry[key] - ingredients[key] });
  }, stock);
};

export const create = (stock: IIngredients): Inventory => {
  let state = merge({}, stock);

  return {
    getState: () => merge({}, state),
    has: (ingredients: IIngredients) => hasIngredients(state, ingredients),
    pop: (ingredients: IIngredients) => {
      state = popIngredients(state, ingredients);
    },
  };
};
