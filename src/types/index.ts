export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  brand?: string;
  sku?: string;
  rating: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: 'title' | 'price' | 'rating';
  direction: SortDirection;
}
