export interface IStock {
  id: number;
  label: string;
  name: string;
  price: number;
}

export interface IBuyStock {
  brokerId: number;
  stockId: number;
  date?: string;
  price: number;
  count: number;
}

export interface IBroker {
  id: number;
  name: string;
  balance: number;
  stocks: {
    id: number;
    prices: {
      date: string;
      price: number;
    }[];
  profit?: number;
  }[];
}