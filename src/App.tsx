import { FormEvent, useEffect, useMemo, useState } from 'react';
import { fetchProducts, login } from './api';
import type { Product, SortState } from './types';

interface SessionState {
  token: string;
  username: string;
}

interface FormProduct {
  title: string;
  price: string;
  brand: string;
  sku: string;
  rating: string;
}

const LOCAL_KEY = 'auth_persist';
const SESSION_KEY = 'auth_session';

function getInitialSession(): SessionState | null {
  const persistent = localStorage.getItem(LOCAL_KEY);
  if (persistent) return JSON.parse(persistent) as SessionState;

  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) return JSON.parse(session) as SessionState;

  return null;
}

function sortProducts(products: Product[], sort: SortState): Product[] {
  return [...products].sort((a, b) => {
    const left = a[sort.key];
    const right = b[sort.key];

    if (left < right) return sort.direction === 'asc' ? -1 : 1;
    if (left > right) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export default function App() {
  const [session, setSession] = useState<SessionState | null>(() => getInitialSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'price', direction: 'asc' });

  const [isAddOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<FormProduct>({
    title: '',
    price: '',
    brand: '',
    sku: '',
    rating: '3'
  });
  const [toast, setToast] = useState<string | null>(null);

  const loadProducts = () => {
    setLoadingProducts(true);
    setProductsError(null);

    fetchProducts(search)
      .then((data) => {
        setProducts(data);
        setSelectedProductIds([]);
      })
      .catch((error: Error) => setProductsError(error.message))
      .finally(() => setLoadingProducts(false));
  };

  useEffect(() => {
    if (!session) return;
    loadProducts();
  }, [session, search]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (!username || !password) {
      setAuthError('Заполните логин и пароль');
      return;
    }

    try {
      setLoadingAuth(true);
      const data = await login(username, password);
      const nextSession: SessionState = { token: data.accessToken, username: data.username };

      if (remember) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(nextSession));
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        localStorage.removeItem(LOCAL_KEY);
      }

      setSession(nextSession);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setSelectedProductIds([]);
  };

  const toggleSort = (key: SortState['key']) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const addProduct = (event: FormEvent) => {
    event.preventDefault();
    if (!newProduct.title || !newProduct.price || !newProduct.brand || !newProduct.sku) {
      setToast('Заполните все обязательные поля');
      return;
    }

    const id = products.length > 0 ? Math.max(...products.map((product) => product.id)) + 1 : 1;
    const productToAdd: Product = {
      id,
      title: newProduct.title,
      price: Number(newProduct.price),
      brand: newProduct.brand,
      sku: newProduct.sku,
      rating: Number(newProduct.rating) || 0
    };

    setProducts((prev) => [productToAdd, ...prev]);
    setSelectedProductIds((prev) => [productToAdd.id, ...prev]);
    setAddOpen(false);
    setNewProduct({ title: '', price: '', brand: '', sku: '', rating: '3' });
    setToast('Товар успешно добавлен');
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allProductsSelected = products.length > 0 && selectedProductIds.length === products.length;

  const toggleSelectAll = () => {
    setSelectedProductIds(allProductsSelected ? [] : products.map((product) => product.id));
  };

  if (!session) {
    return (
      <main className="page auth-page">
        <section className="card auth-card">
          <h1>Вход в систему</h1>
          <p className="hint">Для теста можно использовать: emilys / emilyspass</p>
          <form onSubmit={handleLogin} className="form-grid">
            <label>
              Логин
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Введите username"
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Запомнить меня
            </label>
            {authError && <p className="error">{authError}</p>}
            <button disabled={loadingAuth} type="submit">
              {loadingAuth ? 'Входим...' : 'Войти'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <header className="toolbar">
          <div>
            <h1>Товары</h1>
            <p className="hint">Пользователь: {session.username}</p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={loadProducts} disabled={loadingProducts}>
              Обновить
            </button>
            <button onClick={() => setAddOpen(true)}>Добавить</button>
            <button className="secondary" onClick={handleLogout}>Выйти</button>
          </div>
        </header>

        <div className="search-row">
          <input
            placeholder="Поиск товаров..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <p className="hint">Выбрано товаров: {selectedProductIds.length}</p>

        {loadingProducts && (
          <div className="progress">
            <div className="progress-bar" />
          </div>
        )}

        {productsError && <p className="error">{productsError}</p>}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input type="checkbox" checked={allProductsSelected} onChange={toggleSelectAll} />
                </th>
                <th onClick={() => toggleSort('title')}>Наименование</th>
                <th onClick={() => toggleSort('price')}>Цена</th>
                <th>Вендор</th>
                <th>Артикул</th>
                <th onClick={() => toggleSort('rating')}>Рейтинг</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                  <td>{product.title}</td>
                  <td>{product.price}$</td>
                  <td>{product.brand ?? '—'}</td>
                  <td>{product.sku ?? '—'}</td>
                  <td className={product.rating < 3 ? 'rating-low' : ''}>{product.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <form className="card modal" onClick={(event) => event.stopPropagation()} onSubmit={addProduct}>
            <h2>Добавить товар</h2>
            <label>
              Наименование
              <input
                value={newProduct.title}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              Цена
              <input
                type="number"
                value={newProduct.price}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, price: event.target.value }))}
              />
            </label>
            <label>
              Вендор
              <input
                value={newProduct.brand}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, brand: event.target.value }))}
              />
            </label>
            <label>
              Артикул
              <input
                value={newProduct.sku}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, sku: event.target.value }))}
              />
            </label>
            <label>
              Рейтинг
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={newProduct.rating}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, rating: event.target.value }))}
              />
            </label>
            <div className="actions">
              <button type="button" className="secondary" onClick={() => setAddOpen(false)}>Отмена</button>
              <button type="submit">Сохранить</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
