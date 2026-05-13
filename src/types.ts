export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  unit: string;
  imageUrl?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  productId?: string;
  quantity?: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'product' | 'expense';
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  isBought: boolean;
  createdAt?: string;
}
