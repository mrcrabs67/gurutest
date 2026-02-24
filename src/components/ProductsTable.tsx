import type { Product, SortState } from '../types';
import { formatPrice, getCategory } from '../utils/formatters';

interface ProductsTableProps {
  products: Product[];
  selectedProductIds: number[];
  allProductsSelected: boolean;
  sort: SortState;
  onToggleSort: (key: SortState['key']) => void;
  onToggleSelectAll: () => void;
  onToggleProductSelection: (id: number) => void;
}

export function ProductsTable({
  products,
  selectedProductIds,
  allProductsSelected,
  sort,
  onToggleSort,
  onToggleSelectAll,
  onToggleProductSelection
}: ProductsTableProps) {
  const renderSortIcon = (key: SortState['key']) => {
    if (sort.key !== key) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sort.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th className="checkbox-cell">
              <input type="checkbox" checked={allProductsSelected} onChange={onToggleSelectAll} />
            </th>
            <th className="name-col" onClick={() => onToggleSort('title')}>Наименование {renderSortIcon('title')}</th>
            <th className="vendor-col">Вендор</th>
            <th className="sku-col">Артикул</th>
            <th className="rating-col" onClick={() => onToggleSort('rating')}>Оценка {renderSortIcon('rating')}</th>
            <th className="price-col" onClick={() => onToggleSort('price')}>Цена, ₽ {renderSortIcon('price')}</th>
            <th className="row-action-cell" />
            <th className="row-action-cell" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const selected = selectedProductIds.includes(product.id);
            return (
              <tr key={product.id} className={selected ? 'selected-row' : ''}>
                <td className="checkbox-cell">
                  <input type="checkbox" checked={selected} onChange={() => onToggleProductSelection(product.id)} />
                </td>
                <td className="name-col">
                  <div className="name-cell">
                    <span className="product-preview" />
                    <div>
                      <p className="product-title">{product.title}</p>
                      <p className="product-category">{getCategory(product.title)}</p>
                    </div>
                  </div>
                </td>
                <td className="vendor vendor-col">{product.brand ?? '—'}</td>
                <td className="sku-col">{product.sku ?? '—'}</td>
                <td className={`rating-col ${product.rating < 3.5 ? 'rating-low' : ''}`}>{product.rating.toFixed(1)}/5</td>
                <td className="price-cell price-col">{formatPrice(product.price)}</td>
                <td className="row-action-cell"><button className="pill-btn" type="button">＋</button></td>
                <td className="row-action-cell"><button className="menu-btn" type="button">⋯</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
