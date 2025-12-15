import { useQuery } from '@tanstack/react-query';
import { StoresApi } from '@/services/admin';

interface ShopSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ShopSelect({ value, onChange, className }: ShopSelectProps) {
  const { data: storesResp } = useQuery({
    queryKey: ['stores'],
    queryFn: () => StoresApi.list({ page: 1, size: 100 }), // Assuming max 100 shops for dropdown
  });

  const shops = storesResp?.data?.list || [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring ${className || ''}`}
    >
      <option value="">选择店铺</option>
      {shops.map((store) => (
        <option key={store.id} value={store.name}>
          {store.name}
        </option>
      ))}
    </select>
  );
}
