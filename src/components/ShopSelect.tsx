import { SHOPS } from '@/types';

interface ShopSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ShopSelect({ value, onChange, className }: ShopSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring ${className || ''}`}
    >
      <option value="">选择店铺</option>
      {SHOPS.map((shop) => (
        <option key={shop} value={shop}>
          {shop}
        </option>
      ))}
    </select>
  );
}
