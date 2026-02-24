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

function getCategory(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes('iphone') || normalized.includes('смартфон') || normalized.includes('phone')) return 'Телефоны';
  if (normalized.includes('утюг') || normalized.includes('braun')) return 'Бытовая техника';
  if (normalized.includes('play') || normalized.includes('консоль')) return 'Игровые приставки';
  if (normalized.includes('флэш') || normalized.includes('flash')) return 'Аксессуары';
  return 'Электроника';
}

function formatPrice(value: number): string {
  const [rawIntPart, rawDecimalPart] = value.toFixed(2).split('.');
  const intPart = rawIntPart ?? '0';
  const decimalPart = rawDecimalPart ?? '00';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${decimalPart}`;
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
        <section className="auth-card">
          <div className="auth-logo">◔</div>
          <h1>Добро пожаловать!</h1>
          <p className="hint auth-subtitle">Пожалуйста, авторизируйтесь</p>

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
            <label className="checkbox remember-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Запомнить данные
            </label>
            {authError && <p className="error">{authError}</p>}
            <button disabled={loadingAuth} type="submit" className="primary-btn full-width">
              {loadingAuth ? 'Входим...' : 'Войти'}
            </button>
            <div className="auth-divider">или</div>
            <p className="register-hint">
              Нет аккаунта? <a href="#">Создать</a>
            </p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page products-page">
      <section className="top-strip">
        <h1>Товары</h1>
        <label className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            placeholder="Найти"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      <section className="products-card">
        <header className="products-head">
          <h2>Все позиции</h2>
          <div className="actions">
            <button className="icon-btn" onClick={loadProducts} disabled={loadingProducts} aria-label="Обновить">
              ↻
            </button>
            <button onClick={() => setAddOpen(true)} className="primary-btn add-btn"><span className="add-icon" aria-hidden="true">+</span>Добавить</button>
            <button className="text-btn" onClick={handleLogout}>Выйти</button>
          </div>
        </header>

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
                <th>Вендор</th>
                <th>Артикул</th>
                <th onClick={() => toggleSort('rating')}>Оценка</th>
                <th onClick={() => toggleSort('price')}>Цена, ₽</th>
                <th />
                <th />
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => {
                const selected = selectedProductIds.includes(product.id);
                return (
                  <tr key={product.id} className={selected ? 'selected-row' : ''}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                    <td>
                      <div className="name-cell">
                        <span className="product-preview" />
                        <div>
                          <p className="product-title">{product.title}</p>
                          <p className="product-category">{getCategory(product.title)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="vendor">{product.brand ?? '—'}</td>
                    <td>{product.sku ?? '—'}</td>
                    <td className={product.rating < 3.5 ? 'rating-low' : ''}>{product.rating.toFixed(1)}/5</td>
                    <td className="price-cell">{formatPrice(product.price)}</td>
                    <td className="row-action-cell"><button className="pill-btn" type="button">＋</button></td>
                    <td className="row-action-cell"><button className="menu-btn" type="button">⋯</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="products-footer">
          <p>Показано 1-20 из 120</p>
          <div className="pagination">
            <button type="button">‹</button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">4</button>
            <button type="button">5</button>
            <button type="button">›</button>
          </div>
        </footer>
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
              <button type="button" className="text-btn" onClick={() => setAddOpen(false)}>Отмена</button>
              <button type="submit" className="primary-btn">Сохранить</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
