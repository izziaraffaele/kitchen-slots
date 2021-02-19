export interface IOrder {
  id: string;
  merchantId: string;
  date: Date;
  items: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  processingTime: number;
}

export interface IWorkstation {
  id: string;
  merchantId?: string;
  capacity: number;
  time: number;
}

export interface IIngredients extends Record<string, number> {}
