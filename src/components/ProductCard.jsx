import { useState } from 'react';
import { formatPrice, formatRating } from '../utils/data';
import './ProductCard.css';

function StarRating({ rating }) {
  if (rating == null) return <span className="card-no-rating">No reviews yet</span>;

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <span key={i} className="star star-full">
          ★
        </span>
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <span key={i} className="star star-half">
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="star star-empty">
          ★
        </span>
      );
    }
  }

  return (
    <span className="card-stars">
      {stars}
      <span className="card-rating-num">{formatRating(rating)}</span>
    </span>
  );
}

export default function ProductCard({ item, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const animDelay = `${Math.min(index % 24, 12) * 40}ms`;

  return (
    <article
      className="product-card"
      style={{ animationDelay: animDelay }}
      role="article"
      aria-label={item.title}
    >
      <div className="card-image-wrapper">
        {item.image && !imgError ? (
          <>
            {!imgLoaded && <div className="card-image-skeleton" />}
            <img
              src={item.image}
              alt={item.title}
              className={`card-image ${imgLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="card-image-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {!item.inStock && (
          <div className="card-badge card-badge-oos">Out of stock</div>
        )}

        <div className="card-category-badge">{item.category}</div>
      </div>

      <div className="card-body">
        <p className="card-brand">{item.brand}</p>
        <h3 className="card-title">{item.title}</h3>

        {item.description && (
          <p className="card-description">{item.description}</p>
        )}

        <div className="card-meta">
          <div className="card-rating-row">
            <StarRating rating={item.rating} />
            {item.reviews > 0 && (
              <span className="card-reviews">
                ({item.reviews.toLocaleString()})
              </span>
            )}
          </div>
          <div className="card-price">
            {formatPrice(item.price)}
          </div>
        </div>

        {item.tags.length > 0 && (
          <div className="card-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
