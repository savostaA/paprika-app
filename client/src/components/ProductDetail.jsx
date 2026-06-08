import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Flame, Weight, Tag } from 'lucide-react';
import { fetchProduct, getImageUrl } from '../api';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, items } = useCart();

  useEffect(() => { fetchProduct(id).then(setProduct); }, [id]);

  if (!product) return <div className="page"><div className="skeleton detail-skeleton" /></div>;

  const inCart = items.find(i => i.id === product.id);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="detail-page fade-in">
      {/* Image */}
      <div className="detail-image">
        {product.image_url ? (
          <img src={getImageUrl(product.image_url)} alt={product.name} />
        ) : (
          <div className="detail-img-placeholder"><span>🍽️</span></div>
        )}
        <button className="detail-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="detail-image-overlay" />
      </div>

      {/* Content */}
      <div className="detail-content">
        <div className="detail-header">
          <span className="badge badge-primary">{product.category_name}</span>
          {product.weight && <span className="detail-weight"><Weight size={14} /> {product.weight}</span>}
        </div>

        <h1 className="detail-title">{product.name}</h1>
        {product.description && <p className="detail-desc">{product.description}</p>}

        {/* Ingredients */}
        {product.ingredients?.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title"><Tag size={16} /> Ингредиенты</h3>
            <div className="ingredients-list">
              {product.ingredients.map((ing, i) => (
                <span key={i} className="ingredient-tag">{ing}</span>
              ))}
            </div>
          </div>
        )}

        {/* Calories */}
        {product.calories && (
          <div className="detail-section">
            <h3 className="detail-section-title"><Flame size={16} /> Пищевая ценность</h3>
            <div className="calories-bar glass">
              {product.calories.split('|').map((part, i) => (
                <div key={i} className="calorie-item">
                  <span className="calorie-value">{part.trim().split(':')[0]?.trim() || part.trim().split(' ')[0]}</span>
                  <span className="calorie-label">{part.trim().split(':')[1]?.trim() || part.trim().split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add to cart */}
        <div className="detail-footer glass">
          <div className="detail-price">
            <span className="price-label">Цена</span>
            <span className="price-value">{(product.price * qty).toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-actions">
            <div className="qty-control">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
            </div>
            <button className={`btn btn-primary add-to-cart-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
              <ShoppingCart size={18} />
              {added ? 'Добавлено!' : 'В корзину'}
            </button>
          </div>
          {inCart && <div className="in-cart-notice">В корзине: {inCart.quantity} шт.</div>}
        </div>
      </div>
    </div>
  );
}
