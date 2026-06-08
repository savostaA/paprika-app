import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../api';
import './Cart.css';

export default function Cart() {
  const { items, updateQty, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page">
        <h2 className="page-title">Корзина</h2>
        <div className="empty-state fade-in">
          <span className="empty-icon">🛒</span>
          <p>Корзина пуста</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Перейти в меню</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="page-title">Корзина</h2>
      <div className="cart-container">
        <div className="cart-list">
          {items.map((item, idx) => (
            <div key={item.id} className="cart-item glass slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="cart-item-img">
                {item.image_url ? <img src={getImageUrl(item.image_url)} alt={item.name} /> : <span>🍽️</span>}
              </div>
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <span className="cart-item-weight">{item.weight}</span>
                <span className="cart-item-price">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="cart-item-actions">
                <button className="cart-remove" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                <div className="qty-control-sm">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}><Plus size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-footer glass">
          <div className="cart-total">
            <span>Итого</span>
            <span className="cart-total-price">{totalAmount.toLocaleString('ru-RU')} ₽</span>
          </div>
          <button className="btn btn-primary cart-checkout-btn" onClick={() => navigate('/checkout')}>
            <ShoppingBag size={18} /> Оформить заказ <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
