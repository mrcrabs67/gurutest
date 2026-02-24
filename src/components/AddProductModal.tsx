import { FormEvent } from 'react';

interface FormProduct {
  title: string;
  price: string;
  brand: string;
  sku: string;
  rating: string;
}

interface AddProductModalProps {
  product: FormProduct;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: (field: keyof FormProduct, value: string) => void;
}

export function AddProductModal({ product, onClose, onSubmit, onChange }: AddProductModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="card modal" onClick={(event) => event.stopPropagation()} onSubmit={onSubmit}>
        <h2>Добавить товар</h2>
        <label>
          Наименование
          <input value={product.title} onChange={(event) => onChange('title', event.target.value)} />
        </label>
        <label>
          Цена
          <input type="number" value={product.price} onChange={(event) => onChange('price', event.target.value)} />
        </label>
        <label>
          Вендор
          <input value={product.brand} onChange={(event) => onChange('brand', event.target.value)} />
        </label>
        <label>
          Артикул
          <input value={product.sku} onChange={(event) => onChange('sku', event.target.value)} />
        </label>
        <label>
          Рейтинг
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={product.rating}
            onChange={(event) => onChange('rating', event.target.value)}
          />
        </label>
        <div className="actions">
          <button type="button" className="text-btn" onClick={onClose}>Отмена</button>
          <button type="submit" className="primary-btn">Сохранить</button>
        </div>
      </form>
    </div>
  );
}

export type { FormProduct };
