import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProducts, login } from './api';
import type { Product, SortState } from './types';
import { AddProductModal, FormProduct } from './components/AddProductModal';
import { AuthPage } from './components/AuthPage';
import { ProductsPage } from './components/ProductsPage';

interface SessionState {
  token: string;
  username: string;
}

const LOCAL_KEY = 'auth_persist';
const SESSION_KEY = 'auth_session';
const ITEMS_PER_PAGE = 5;

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
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'price', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<FormProduct>({
    title: '',
    price: '',
    brand: '',
    sku: '',
    rating: '3'
  });
  const [toast, setToast] = useState<string | null>(null);

  const loadProducts = useCallback(() => {
    setLoadingProducts(true);
    setProductsError(null);

    fetchProducts(search)
      .then((data) => {
        setProducts(data);
        setSelectedProductIds([]);
        setCurrentPage(1);
      })
      .catch((error: Error) => setProductsError(error.message))
      .finally(() => setLoadingProducts(false));
  }, [search]);

  useEffect(() => {
    if (!session) return;
    loadProducts();
  }, [session, loadProducts]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, sortedProducts]);

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
    setCurrentPage(1);
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

  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  }, [currentPage, totalPages]);

  const startIndex = sortedProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, sortedProducts.length);

  if (!session) {
    return (
      <AuthPage
        username={username}
        password={password}
        remember={remember}
        showPassword={showPassword}
        authError={authError}
        loadingAuth={loadingAuth}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onRememberChange={setRemember}
        onTogglePassword={() => setShowPassword((prev) => !prev)}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <>
      <ProductsPage
        search={search}
        loadingProducts={loadingProducts}
        productsError={productsError}
        paginatedProducts={paginatedProducts}
        selectedProductIds={selectedProductIds}
        allProductsSelected={allProductsSelected}
        sort={sort}
        currentPage={currentPage}
        totalPages={totalPages}
        visiblePageNumbers={visiblePageNumbers}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={sortedProducts.length}
        onSearchChange={setSearch}
        onRefresh={loadProducts}
        onOpenAdd={() => setAddOpen(true)}
        onToggleSort={toggleSort}
        onToggleSelectAll={toggleSelectAll}
        onToggleProductSelection={toggleProductSelection}
        onPrevPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        onSetPage={setCurrentPage}
      />

      {isAddOpen && (
        <AddProductModal
          product={newProduct}
          onClose={() => setAddOpen(false)}
          onSubmit={addProduct}
          onChange={(field, value) => setNewProduct((prev) => ({ ...prev, [field]: value }))}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
