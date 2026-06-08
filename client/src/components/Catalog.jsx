import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Star } from 'lucide-react';
import { fetchCategories, fetchProducts, getImageUrl } from '../api';
import { useCart } from '../context/CartContext';
import './Catalog.css';

const CATEGORY_EXPLANATIONS = {
  1: {
    title: "🥂 Банкетное меню",
    desc: "Классическое сытное застолье с полной рассадкой гостей. Официанты подают блюда порционно или в общих тарелках. Отлично подходит, когда гости проводят за столом несколько часов.",
    differences: "В отличие от фуршета, это полноценный обед/ужин с переменой горячих блюд и приборами.",
    stats: ["От 10-15 гостей", "До 3000 человек", "Сытный формат"]
  },
  2: {
    title: "🍢 Фуршетный формат",
    desc: "Свободное общение гостей без жесткой привязки к стульям. Все закуски миниатюрные («на один укус» — канапе, тарталетки, брускетты), их удобно брать руками без приборов.",
    differences: "В отличие от банкета, фуршет легче, мобильнее, не требует посадки и дешевле на человека.",
    stats: ["Любое число гостей", "До 3000 человек", "Мини-закуски"]
  },
  3: {
    title: "☕ Кофе-брейк",
    desc: "Короткая пауза для отдыха и восстановления сил (на 15-30 минут) во время семинаров, конференций или бизнес-встреч.",
    differences: "Лёгкий перекус: чай, ароматный кофе, мини-сэндвичи и сладкая выпечка.",
    stats: ["Пауза 15-30 мин", "До 3000 человек", "Чай, кофе и выпечка"]
  },
  4: {
    title: "🔥 Барбекю / Гриль",
    desc: "Пикники и вечеринки на открытом воздухе с ароматом костра. Блюда готовятся шеф-поваром прямо на углях при гостях.",
    differences: "Горячие стейки, сочные рёбрышки и шашлыки с дымком на природе вместо банкетного зала.",
    stats: ["Формат на воздухе", "До 3000 человек", "Аромат угля"]
  }
};

export default function Catalog() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

  // === 7-tap admin trigger ===
  const clicksRef = useRef(0);
  const timerRef = useRef(null);
  const heroLogoRef = useRef(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    const el = heroLogoRef.current;
    if (!el) return;

    const handler = () => {

      clicksRef.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);

      if (clicksRef.current >= 7) {
        clicksRef.current = 0;
        setShowAdminModal(true);
        setAdminPassword('');
        setAdminError('');
      } else {
        timerRef.current = setTimeout(() => {
          clicksRef.current = 0;
        }, 3000);
      }
    };

    el.addEventListener('click', handler);
    return () => {
      el.removeEventListener('click', handler);
    };
  }, []);

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminPassword === 'paprika2026') {
      setShowAdminModal(false);
      navigate('/admin');
    } else {
      setAdminError('Неверный пароль!');
      setAdminPassword('');
    }
  };
  // === end 7-tap ===

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProducts()]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter(p => {
    if (activeCategory && Number(p.category_id) !== Number(activeCategory)) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = (e, product) => {
    e.stopPropagation();
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 600);
  };

  return (
    <div className="page">
      {/* Hero — tap logo 7 times to open admin */}
      <div className="hero fade-in">
        <img
          ref={heroLogoRef}
          src={getImageUrl('/uploads/logo.png')}
          className="hero-logo-img"
          alt="🌶️"
          style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}
        />
        <div className="hero-content">
          <h1 className="hero-title">Паприка</h1>
          <p className="hero-sub">Кейтеринг · Северодвинск · Архангельск</p>
        </div>
      </div>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass">
            <h3>Вход для администратора</h3>
            <form onSubmit={handleAdminSubmit}>
              <input
                type="password"
                placeholder="Введите пароль"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                className="admin-modal-input"
              />
              {adminError && <p className="admin-modal-error">{adminError}</p>}
              <div className="admin-modal-buttons">
                <button type="button" onClick={() => setShowAdminModal(false)} className="btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Войти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-bar glass fade-in">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Найти блюдо..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Categories */}
      <div className="categories fade-in">
        <button className={`cat-chip ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>Все</button>
        {categories.map(c => (
          <button key={c.id} className={`cat-chip ${activeCategory === c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>
            <span>{c.icon}</span> {c.name}
          </button>
        ))}
      </div>

      {/* Category Info Explanation Card */}
      {activeCategory && CATEGORY_EXPLANATIONS[activeCategory] && (
        <div className="category-info-card fade-in">
          <div className="cat-info-title-wrap">
            <span className="cat-info-accent-line"></span>
            <h4>{CATEGORY_EXPLANATIONS[activeCategory].title}</h4>
          </div>
          <p className="cat-info-desc">{CATEGORY_EXPLANATIONS[activeCategory].desc}</p>
          <div className="cat-info-diff-wrap">
            <span className="cat-info-diff-bullet">💡</span>
            <p className="cat-info-differences">{CATEGORY_EXPLANATIONS[activeCategory].differences}</p>
          </div>
          <div className="cat-info-stats">
            {CATEGORY_EXPLANATIONS[activeCategory].stats.map((stat, i) => (
              <span key={i} className="cat-info-tag">{stat}</span>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="products-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton product-skeleton" />)}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((p, idx) => (
            <div key={p.id} className="product-card glass slide-up" style={{ animationDelay: `${idx * 0.05}s` }}
               onClick={() => navigate(`/product/${p.id}`)}>
              <div className="product-img">
                {p.image_url ? (
                  <img src={getImageUrl(p.image_url)} alt={p.name} />
                ) : (
                  <div className="product-img-placeholder">
                    <span>{categories.find(c => Number(c.id) === Number(p.category_id))?.icon || '🍽️'}</span>
                  </div>
                )}
                <span className="product-weight">{p.weight}</span>
              </div>
              <div className="product-info">
                <h3 className="product-name">{p.name}</h3>
                <div className="product-bottom">
                  <span className="product-price">{p.price.toLocaleString('ru-RU')} ₽</span>
                  <button className={`add-btn ${addedId === p.id ? 'added' : ''}`} onClick={(e) => handleAdd(e, p)}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="empty-state fade-in">
          <span className="empty-icon">🔍</span>
          <p>Ничего не найдено</p>
        </div>
      )}
    </div>
  );
}
