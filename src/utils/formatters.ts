export function getCategory(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes('iphone') || normalized.includes('смартфон') || normalized.includes('phone')) return 'Телефоны';
  if (normalized.includes('утюг') || normalized.includes('braun')) return 'Бытовая техника';
  if (normalized.includes('play') || normalized.includes('консоль')) return 'Игровые приставки';
  if (normalized.includes('флэш') || normalized.includes('flash')) return 'Аксессуары';
  return 'Электроника';
}

export function formatPrice(value: number): string {
  const [rawIntPart, rawDecimalPart] = value.toFixed(2).split('.');
  const intPart = rawIntPart ?? '0';
  const decimalPart = rawDecimalPart ?? '00';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${decimalPart}`;
}
