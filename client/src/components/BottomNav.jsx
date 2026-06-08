import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './BottomNav.css';

export default function BottomNav() {
  const { totalItems } = useCart();
  const links = [
    { to: '/', icon: Home, label: 'Меню' },
    { to: '/cart', icon: ShoppingCart, label: 'Корзина', badge: totalItems },
    { to: '/orders', icon: ClipboardList, label: 'Заказы' },
  ];

  return (
    <nav className="bottom-nav glass">
      {links.map(({ to, icon: Icon, label, badge }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end={to === '/'}>
          <div className="nav-icon-wrap">
            <Icon size={22} />
            {badge > 0 && <span className="nav-badge">{badge}</span>}
          </div>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
