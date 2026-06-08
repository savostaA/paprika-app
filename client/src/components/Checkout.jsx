import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, Phone, User, MapPin, Calendar, MessageSquare, Users, ChefHat, Wine, ClipboardCheck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api';
import './Checkout.css';

const EVENT_TYPES = ['Банкет', 'Фуршет', 'Корпоратив', 'Кофе-брейк', 'Свадьба', 'День рождения', 'Барбекю', 'Другое'];

// Staffing ratios: 1 staff member per N guests
const STAFF_RATIOS = {
  'Банкет':        { waiter: 10, cook: 30, barman: 40, coordinator: 100, dishwasher: 50 },
  'Фуршет':        { waiter: 15, cook: 40, barman: 30, coordinator: 100, dishwasher: 60 },
  'Корпоратив':    { waiter: 12, cook: 30, barman: 35, coordinator: 100, dishwasher: 50 },
  'Кофе-брейк':    { waiter: 25, cook: 50, barman: 0,  coordinator: 150, dishwasher: 80 },
  'Свадьба':       { waiter: 10, cook: 25, barman: 30, coordinator: 80,  dishwasher: 50 },
  'День рождения': { waiter: 10, cook: 25, barman: 30, coordinator: 80,  dishwasher: 50 },
  'Барбекю':       { waiter: 15, cook: 20, barman: 30, coordinator: 100, dishwasher: 50 },
  'Другое':        { waiter: 12, cook: 30, barman: 35, coordinator: 100, dishwasher: 50 },
};

function calcStaff(eventType, guestCount) {
  const ratios = STAFF_RATIOS[eventType];
  if (!ratios || !guestCount || guestCount <= 0) return null;

  const calc = (ratio) => ratio === 0 ? 0 : Math.max(1, Math.ceil(guestCount / ratio));

  return {
    waiter:      calc(ratios.waiter),
    cook:        calc(ratios.cook),
    barman:      calc(ratios.barman),
    coordinator: calc(ratios.coordinator),
    dishwasher:  calc(ratios.dishwasher),
  };
}

const STAFF_META = [
  { key: 'waiter',      label: 'Официанты',   icon: '🤵', color: '#3b82f6' },
  { key: 'cook',        label: 'Повара',       icon: '👨‍🍳', color: '#ef4444' },
  { key: 'barman',      label: 'Бармены',      icon: '🍸', color: '#8b5cf6' },
  { key: 'coordinator', label: 'Координаторы', icon: '📋', color: '#f59e0b' },
  { key: 'dishwasher',  label: 'Посудомойки',  icon: '🧹', color: '#6b7280' },
];

function StaffCalculator({ staff }) {
  const total = Object.values(staff).reduce((s, v) => s + v, 0);

  return (
    <div className="staff-card glass slide-up">
      <div className="staff-card-header">
        <Sparkles size={18} />
        <h4>Рекомендуемый персонал</h4>
      </div>
      <div className="staff-grid">
        {STAFF_META.map(({ key, label, icon, color }) => (
          staff[key] > 0 && (
            <div key={key} className="staff-row">
              <div className="staff-role">
                <span className="staff-icon">{icon}</span>
                <span>{label}</span>
              </div>
              <span className="staff-count" style={{ color }}>{staff[key]} чел.</span>
            </div>
          )
        ))}
      </div>
      <div className="staff-total">
        <span>Итого команда</span>
        <span className="staff-total-count">{total} чел.</span>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    client_name: '', client_phone: '', event_type: '', event_date: '',
    event_time: '', delivery_address: '', comment: '', guest_count: ''
  });
  const [sent, setSent] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const staff = useMemo(() => {
    const count = parseInt(form.guest_count, 10);
    if (!form.event_type || !count || count <= 0) return null;
    return calcStaff(form.event_type, Math.min(count, 3000));
  }, [form.event_type, form.guest_count]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.client_phone) return;
    setLoading(true);

    // Build staff info string to append to comment
    let staffComment = form.comment || '';
    if (staff) {
      const staffLines = STAFF_META
        .filter(({ key }) => staff[key] > 0)
        .map(({ key, label }) => `${label}: ${staff[key]}`)
        .join(', ');
      const total = Object.values(staff).reduce((s, v) => s + v, 0);
      staffComment += `\n\n--- Расчёт персонала (${form.guest_count} гостей) ---\n${staffLines}\nИтого: ${total} чел.`;
    }

    try {
      const order = await createOrder({
        ...form,
        comment: staffComment.trim(),
        items: items.map(i => ({ product_id: i.id, product_name: i.name, quantity: i.quantity, price: i.price }))
      });
      setSent(order);
      clearCart();
    } catch { alert('Ошибка отправки'); }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="page">
        <div className="success-card glass fade-in">
          <CheckCircle size={56} className="success-icon" />
          <h2>Заказ отправлен!</h2>
          <p className="success-number">№ {sent.order_number}</p>
          <p className="success-text">Мы свяжемся с вами в ближайшее время для подтверждения</p>
          <div className="success-total">Сумма: {sent.total_amount?.toLocaleString('ru-RU')} ₽</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Вернуться в меню</button>
        </div>
      </div>
    );
  }

  if (!items.length) { navigate('/cart'); return null; }

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Назад</button>
      <h2 className="page-title">Оформление заказа</h2>

      <form onSubmit={submit} className="checkout-form">
        <div className="checkout-form-fields">
          <div className="form-group slide-up">
            <label><User size={14} /> Ваше имя *</label>
            <input required value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Иван Иванов" />
          </div>
          <div className="form-group slide-up" style={{ animationDelay: '0.05s' }}>
            <label><Phone size={14} /> Телефон *</label>
            <input required type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} placeholder="+7 (999) 123-45-67" />
          </div>
          <div className="form-group slide-up" style={{ animationDelay: '0.1s' }}>
            <label>Тип мероприятия</label>
            <select value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              <option value="">Выберите...</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group slide-up" style={{ animationDelay: '0.12s' }}>
            <label><Users size={14} /> Количество гостей</label>
            <input
              type="number"
              min="1"
              max="3000"
              value={form.guest_count}
              onChange={e => set('guest_count', e.target.value)}
              placeholder="Например, 150"
            />
            <span className="form-hint">Обслуживаем мероприятия до 3 000 человек</span>
          </div>

          {/* Staff Calculator Card */}
          {staff && <StaffCalculator staff={staff} />}

          <div className="form-row">
            <div className="form-group slide-up" style={{ animationDelay: '0.15s' }}>
              <label><Calendar size={14} /> Дата</label>
              <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
            <div className="form-group slide-up" style={{ animationDelay: '0.15s' }}>
              <label>Время</label>
              <input type="time" value={form.event_time} onChange={e => set('event_time', e.target.value)} />
            </div>
          </div>
          <div className="form-group slide-up" style={{ animationDelay: '0.2s' }}>
            <label><MapPin size={14} /> Адрес доставки</label>
            <input value={form.delivery_address} onChange={e => set('delivery_address', e.target.value)} placeholder="г. Северодвинск, ул. ..." />
          </div>
          <div className="form-group slide-up" style={{ animationDelay: '0.25s' }}>
            <label><MessageSquare size={14} /> Комментарий</label>
            <textarea rows="3" value={form.comment} onChange={e => set('comment', e.target.value)} placeholder="Пожелания к заказу..." />
          </div>
        </div>

        <div className="checkout-form-sidebar">
          <div className="checkout-summary glass slide-up" style={{ animationDelay: '0.3s' }}>
            <h4>Ваш заказ</h4>
            {items.map(i => (
              <div key={i.id} className="checkout-item">
                <span>{i.name} × {i.quantity}</span>
                <span>{(i.price * i.quantity).toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
            <div className="checkout-total">
              <span>Итого:</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary checkout-submit" disabled={loading}>
            <Send size={18} /> {loading ? 'Отправляю...' : 'Отправить заказ'}
          </button>
        </div>
      </form>
    </div>
  );
}
