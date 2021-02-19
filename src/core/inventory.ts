import merge from 'lodash/merge';
import { IIngredients } from './interfaces';

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
  }, {} as IIngredients);
};
