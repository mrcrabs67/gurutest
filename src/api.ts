import type { AuthResponse, Product, ProductsResponse } from './types';

const API_BASE = 'https://dummyjson.com';

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, expiresInMins: 30 })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? 'Ошибка авторизации');
  }

  return response.json() as Promise<AuthResponse>;
}

export async function fetchProducts(query: string): Promise<Product[]> {
  const endpoint = query.trim().length > 0
    ? `${API_BASE}/products/search?q=${encodeURIComponent(query)}`
    : `${API_BASE}/products?limit=100`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Не удалось загрузить товары');
  }

  const data = (await response.json()) as ProductsResponse;
  return data.products;
}
