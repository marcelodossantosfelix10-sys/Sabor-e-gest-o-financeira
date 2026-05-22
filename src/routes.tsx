import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Finance from './components/Finance';
import Reports from './components/Reports';
import ShoppingList from './components/ShoppingList';
import Orders from './components/Orders';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/shopping" element={<ShoppingList />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
