import { useState, useEffect } from 'react';
import { BarChart3, ShoppingBag, Package, DollarSign, ChevronRight, Plus, Trash2, Edit, Upload, X, Check } from 'lucide-react';
import { fetchStats, fetchOrders, updateOrderStatus, fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct, uploadImage, getImageUrl, createCategory, updateCategory, deleteCategory } from '../api';
import './Admin.css';

const STATUS_MAP = {
  new: { label: 'Новый', class: 'badge-warning', next: 'confirmed' },
  confirmed: { label: 'Подтверждён', class: 'badge-primary', next: 'cooking' },
  cooking: { label: 'Готовится', class: 'badge-warning', next: 'delivering' },
  delivering: { label: 'Доставка', class: 'badge-primary', next: 'done' },
  done: { label: 'Завершён', class: 'badge-success', next: null },
  cancelled: { label: 'Отменён', class: '', next: null },
};

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editProd, setEditProd] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Categories Form & State
  const [editCat, setEditCat] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '', icon: '🍽️', sort_order: 0 });

  const load = async () => {
    try {
      const [s, o, p, c] = await Promise.all([fetchStats(), fetchOrders(), fetchProducts({ active_only: 'false' }), fetchCategories()]);
      setStats(s); setOrders(o); setProducts(p); setCategories(c);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };
  useEffect(() => { load(); }, []);

  const advanceStatus = async (id, status) => {
    const st = STATUS_MAP[status];
    if (!st?.next) return;
    await updateOrderStatus(id, st.next);
    load();
  };

  const cancelOrder = async (id) => {
    await updateOrderStatus(id, 'cancelled');
    load();
  };

  // Product form
  const [form, setForm] = useState({ name: '', description: '', category_id: '', price: '', weight: '', ingredients: '', calories: '', is_active: 1 });

  const openNew = () => { setForm({ name: '', description: '', category_id: categories[0]?.id ? String(categories[0].id) : '', price: '', weight: '', ingredients: '', calories: '', is_active: 1 }); setEditProd(null); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p, ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : p.ingredients, category_id: p.category_id ? String(p.category_id) : '' }); setEditProd(p); setShowForm(true); };

  const saveProduct = async (e) => {
    e.preventDefault();
    const data = { 
      ...form, 
      price: Number(form.price), 
      category_id: form.category_id ? Number(form.category_id) : null,
      ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean) 
    };
    if (editProd) { await updateProduct(editProd.id, data); } else { await createProduct(data); }
    setShowForm(false); load();
  };

  const handleUpload = async (e, productId) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadImage(file, productId);
    load();
  };

  const handleDelete = async (id) => { if (confirm('Удалить блюдо?')) { await deleteProduct(id); load(); } };

  // Category operations
  const openNewCat = () => {
    setCatForm({ name: '', slug: '', icon: '🍽️', sort_order: 0 });
    setEditCat(null);
    setShowCatForm(true);
  };
  
  const openEditCat = (c) => {
    setCatForm({ ...c });
    setEditCat(c);
    setShowCatForm(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    try {
      const data = { ...catForm, sort_order: Number(catForm.sort_order) };
      if (editCat) {
        await updateCategory(editCat.id, data);
      } else {
        await createCategory(data);
      }
      setShowCatForm(false);
      load();
    } catch (err) {
      alert('Ошибка при сохранении категории: ' + err.message);
    }
  };

  const handleDeleteCat = async (id) => {
    if (confirm('Удалить категорию?')) {
      try {
        const res = await deleteCategory(id);
        if (res.error) {
          alert('Нельзя удалить категорию, пока в ней есть блюда.');
        } else {
          load();
        }
      } catch (err) {
        alert('Нельзя удалить категорию, пока в ней есть блюда.');
      }
    }
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Сводка' },
    { id: 'orders', label: '📦 Заказы' },
    { id: 'menu', label: '🍽️ Меню' },
    { id: 'categories', label: '🏷️ Категории' },
  ];

  return (
    <div className="page admin-page">
      <h2 className="page-title">Админ-панель</h2>
      <div className="admin-tabs">
        {tabs.map(t => <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && stats && (
        <div className="dashboard fade-in">
          <div className="stat-grid">
            {[
              { icon: <ShoppingBag size={20} />, label: 'Новых заказов', value: stats.new_orders, color: 'var(--primary)' },
              { icon: <Package size={20} />, label: 'Заказов сегодня', value: stats.today_orders, color: 'var(--secondary)' },
              { icon: <DollarSign size={20} />, label: 'Выручка сегодня', value: stats.today_revenue?.toLocaleString('ru-RU') + ' ₽', color: 'var(--success)' },
              { icon: <BarChart3 size={20} />, label: 'Всего выручка', value: stats.total_revenue?.toLocaleString('ru-RU') + ' ₽', color: 'var(--warning)' },
            ].map((s, i) => (
              <div key={i} className="stat-card glass slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="admin-orders fade-in">
          {orders.length === 0 && <div className="empty-state"><span className="empty-icon">📭</span><p>Заказов пока нет</p></div>}
          {orders.map((o, idx) => {
            const st = STATUS_MAP[o.status] || STATUS_MAP.new;
            return (
              <div key={o.id} className="admin-order-card glass slide-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="order-header">
                  <div>
                    <span className="order-number">{o.order_number}</span>
                    <span className="order-date">{new Date(o.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                  <span className={`badge ${st.class}`}>{st.label}</span>
                </div>
                <div className="order-client">👤 {o.client_name} · 📞 {o.client_phone}</div>
                {o.delivery_address && <div className="order-addr">📍 {o.delivery_address}</div>}
                {o.event_type && <div className="order-event">🎪 {o.event_type} {o.event_date && `· ${o.event_date}`} {o.event_time && o.event_time}</div>}
                <div className="order-items-admin">{o.items?.map(i => <div key={i.id}>{i.product_name} × {i.quantity} — {(i.price * i.quantity).toLocaleString('ru-RU')} ₽</div>)}</div>
                <div className="order-footer">
                  <span className="order-total">{o.total_amount?.toLocaleString('ru-RU')} ₽</span>
                  <div className="order-actions">
                    {st.next && <button className="btn btn-sm btn-primary" onClick={() => advanceStatus(o.id, o.status)}><ChevronRight size={14} /> {STATUS_MAP[st.next]?.label}</button>}
                    {o.status !== 'cancelled' && o.status !== 'done' && <button className="btn btn-sm btn-secondary" onClick={() => cancelOrder(o.id)}><X size={14} /> Отмена</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MENU */}
      {tab === 'menu' && (
        <div className="admin-menu fade-in">
          <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={openNew}><Plus size={16} /> Добавить блюдо</button>
          {showForm && (
            <form className="product-form glass slide-up" onSubmit={saveProduct}>
              <h3>{editProd ? 'Редактировать' : 'Новое блюдо'}</h3>
              <input required placeholder="Название" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <textarea placeholder="Описание" rows="2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <select value={String(form.category_id)} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.icon} {c.name}</option>)}
              </select>
              <div className="form-row">
                <input required type="number" placeholder="Цена ₽" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                <input placeholder="Вес (350 г)" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
              </div>
              <input placeholder="Ингредиенты (через запятую)" value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} />
              <input placeholder="КБЖУ (Б: 42 | Ж: 28 | У: 15 | 480 ккал)" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
              <div className="form-row">
                <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Сохранить</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}><X size={14} /> Отмена</button>
              </div>
            </form>
          )}
          <div className="menu-list">
            {products.map((p, idx) => (
              <div key={p.id} className={`menu-item glass slide-up ${!p.is_active ? 'inactive' : ''}`} style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="menu-item-img">
                  {p.image_url ? <img src={getImageUrl(p.image_url)} alt={p.name} /> : <span>{categories.find(c => Number(c.id) === Number(p.category_id))?.icon || '🍽️'}</span>}
                </div>
                <div className="menu-item-info">
                  <h4>{p.name}</h4>
                  <span>{p.weight} · {p.price?.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="menu-item-actions">
                  <label className="upload-btn" title="Загрузить фото"><Upload size={14} /><input type="file" accept="image/*" hidden onChange={e => handleUpload(e, p.id)} /></label>
                  <button title="Редактировать" onClick={() => openEdit(p)}><Edit size={14} /></button>
                  <button title="Удалить" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <div className="admin-menu fade-in">
          <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={openNewCat}><Plus size={16} /> Добавить категорию</button>
          {showCatForm && (
            <form className="product-form glass slide-up" onSubmit={saveCategory}>
              <h3>{editCat ? 'Редактировать категорию' : 'Новая категория'}</h3>
              <input required placeholder="Название (например, Фуршет)" value={catForm.name} onChange={e => setCatForm(c => ({ ...c, name: e.target.value }))} />
              <input required placeholder="Slug (например, buffet)" value={catForm.slug} onChange={e => setCatForm(c => ({ ...c, slug: e.target.value }))} />
              <input placeholder="Иконка (эмодзи, например, 🍢)" value={catForm.icon} onChange={e => setCatForm(c => ({ ...c, icon: e.target.value }))} />
              <input type="number" placeholder="Порядок сортировки (например, 1)" value={catForm.sort_order} onChange={e => setCatForm(c => ({ ...c, sort_order: e.target.value }))} />
              <div className="form-row">
                <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Сохранить</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCatForm(false)}><X size={14} /> Отмена</button>
              </div>
            </form>
          )}
          <div className="menu-list">
            {categories.map((c, idx) => (
              <div key={c.id} className="menu-item glass slide-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="menu-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  <span>{c.icon || '🍽️'}</span>
                </div>
                <div className="menu-item-info">
                  <h4>{c.name}</h4>
                  <span>Slug: {c.slug} · Порядок: {c.sort_order}</span>
                </div>
                <div className="menu-item-actions">
                  <button title="Редактировать" onClick={() => openEditCat(c)}><Edit size={14} /></button>
                  <button title="Удалить" onClick={() => handleDeleteCat(c.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
