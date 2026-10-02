import { supabase } from '../../supabase';

export const FALLBACK_MARKETS = [
  { symbol: 'BTCUSD', display_name: 'Bitcoin / USD', asset_type: 'Crypto', price: 68000 },
  { symbol: 'ETHUSD', display_name: 'Ethereum / USD', asset_type: 'Crypto', price: 3400 },
  { symbol: 'AAPL', display_name: 'Apple', asset_type: 'Stock', price: 220 },
  { symbol: 'TSLA', display_name: 'Tesla', asset_type: 'Stock', price: 340 },
  { symbol: 'EURUSD', display_name: 'Euro / USD', asset_type: 'Forex', price: 1.18 },
  { symbol: 'XAUUSD', display_name: 'Gold / USD', asset_type: 'Commodity', price: 2640 },
];

export async function getDemoMarkets() {
  const { data, error } = await supabase
    .from('demo_market_prices')
    .select('symbol, display_name, asset_type, price, updated_at')
    .order('symbol');

  if (error) return FALLBACK_MARKETS;
  return data && data.length ? data : FALLBACK_MARKETS;
}

export async function getVirtualPositions() {
  const { data, error } = await supabase
    .from('virtual_positions')
    .select('symbol, quantity, avg_price, updated_at')
    .gt('quantity', 0)
    .order('symbol');

  if (error) throw error;
  return data || [];
}

export async function placeVirtualOrder(symbol, side, quantity) {
  const { data, error } = await supabase.rpc('place_virtual_order', {
    p_symbol: symbol,
    p_side: side,
    p_quantity: quantity,
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
