import { useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../api';
import './Header.css';

export default function Header() {
  const { totalItems } = useCart();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const links = [
    { to: '/', icon: Home, label: 'Меню' },
    { to: '/cart', icon: ShoppingCart, label: 'Корзина', badge: totalItems },
    { to: '/orders', icon: ClipboardList, label: 'Заказы' },
  ];

  return (
    <header className={`main-header glass ${isHome ? 'is-home' : ''}`}>
      <div className="header-container">
        <Link to="/" className="header-brand">
          <img src={getImageUrl('/uploads/logo.png')} className="header-logo" alt="🌶️" />
          <span className="header-title">Паприка</span>
        </Link>

        <nav className="header-nav">
          {links.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`} end={to === '/'}>
              <Icon size={18} />
              <span>{label}</span>
              {badge > 0 && <span className="header-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
