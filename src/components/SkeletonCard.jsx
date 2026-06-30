import './SkeletonCard.css';

export default function SkeletonCard() {
  return (
    <article className="skeleton-card" aria-hidden="true">
      <div className="skeleton-image">
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-brand" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-title-short" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-meta">
          <div className="skeleton-line skeleton-rating" />
          <div className="skeleton-line skeleton-price" />
        </div>
        <div className="skeleton-tags">
          <div className="skeleton-line skeleton-tag" />
          <div className="skeleton-line skeleton-tag" />
        </div>
      </div>
    </article>
  );
}
