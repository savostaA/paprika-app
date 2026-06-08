import { useState } from 'react';
import { Search } from 'lucide-react';
import { fetchOrders } from '../api';
import './Orders.css';

const STATUS_MAP = {
  new: { label: 'Новый', class: 'badge-warning', icon: '🆕' },
  confirmed: { label: 'Подтверждён', class: 'badge-primary', icon: '✅' },
  cooking: { label: 'Готовится', class: 'badge-warning', icon: '👨‍🍳' },
  delivering: { label: 'Доставка', class: 'badge-primary', icon: '🚗' },
  done: { label: 'Завершён', class: 'badge-success', icon: '🎉' },
  cancelled: { label: 'Отменён', class: '', icon: '❌' },
};

export default function Orders() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!phone.trim()) return;
    const all = await fetchOrders();
    const mine = all.filter(o => o.client_phone.replace(/\D/g, '').includes(phone.replace(/\D/g, '')));
    setOrders(mine);
    setSearched(true);
  };

  return (
    <div className="page">
      <h2 className="page-title">Мои заказы</h2>
      <div className="search-bar glass fade-in">
        <Search size={18} className="search-icon" />
        <input placeholder="Введите ваш телефон..." value={phone} onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()} />
        <button className="btn btn-sm btn-primary" onClick={search}>Найти</button>
      </div>

      {searched && orders.length === 0 && (
        <div className="empty-state fade-in"><span className="empty-icon">📋</span><p>Заказы не найдены</p></div>
      )}

      <div className="orders-list">
        {orders.map((o, idx) => {
          const st = STATUS_MAP[o.status] || STATUS_MAP.new;
          return (
            <div key={o.id} className="order-card glass slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="order-header">
                <span className="order-number">{o.order_number}</span>
                <span className={`badge ${st.class}`}>{st.icon} {st.label}</span>
              </div>
              <div className="order-date">{new Date(o.created_at).toLocaleString('ru-RU')}</div>
              <div className="order-items-list">
                {o.items?.map(i => <div key={i.id} className="order-item-row">{i.product_name} × {i.quantity}</div>)}
              </div>
              <div className="order-total">Сумма: {o.total_amount?.toLocaleString('ru-RU')} ₽</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
