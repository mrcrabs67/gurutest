import type { Product, SortState } from '../types';
import { ProductsTable } from './ProductsTable';

interface ProductsPageProps {
  search: string;
  loadingProducts: boolean;
  productsError: string | null;
  paginatedProducts: Product[];
  selectedProductIds: number[];
  allProductsSelected: boolean;
  sort: SortState;
  currentPage: number;
  totalPages: number;
  visiblePageNumbers: number[];
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onOpenAdd: () => void;
  onToggleSort: (key: SortState['key']) => void;
  onToggleSelectAll: () => void;
  onToggleProductSelection: (id: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetPage: (page: number) => void;
}

export function ProductsPage({
  search,
  loadingProducts,
  productsError,
  paginatedProducts,
  selectedProductIds,
  allProductsSelected,
  sort,
  currentPage,
  totalPages,
  visiblePageNumbers,
  startIndex,
  endIndex,
  totalItems,
  onSearchChange,
  onRefresh,
  onOpenAdd,
  onToggleSort,
  onToggleSelectAll,
  onToggleProductSelection,
  onPrevPage,
  onNextPage,
  onSetPage
}: ProductsPageProps) {
  return (
    <main className="page products-page">
      <section className="top-strip">
        <h1>Товары</h1>
        <label className="search-input-wrap">
          <span className="search-icon" aria-hidden="true" />
          <input placeholder="Найти" value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </label>
      </section>

      <section className="products-card">
        <header className="products-head">
          <h2>Все позиции</h2>
          <div className="actions">
            <button className="icon-btn" onClick={onRefresh} disabled={loadingProducts} aria-label="Обновить">↻</button>
            <button onClick={onOpenAdd} className="primary-btn add-btn"><span className="add-icon" aria-hidden="true">+</span>Добавить</button>
          </div>
        </header>

        {loadingProducts && (
          <div className="progress">
            <div className="progress-bar" />
          </div>
        )}

        {productsError && <p className="error">{productsError}</p>}

        <ProductsTable
          products={paginatedProducts}
          selectedProductIds={selectedProductIds}
          allProductsSelected={allProductsSelected}
          sort={sort}
          onToggleSort={onToggleSort}
          onToggleSelectAll={onToggleSelectAll}
          onToggleProductSelection={onToggleProductSelection}
        />

        <footer className="products-footer">
          <p>Показано {startIndex}-{endIndex} из {totalItems}</p>
          <div className="pagination">
            <button type="button" onClick={onPrevPage} disabled={currentPage === 1}>‹</button>
            {visiblePageNumbers.map((page) => (
              <button type="button" key={page} className={page === currentPage ? 'active' : ''} onClick={() => onSetPage(page)}>
                {page}
              </button>
            ))}
            <button type="button" onClick={onNextPage} disabled={currentPage === totalPages}>›</button>
          </div>
        </footer>
      </section>
    </main>
  );
}
