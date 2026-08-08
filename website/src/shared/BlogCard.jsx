import React from 'react';
import { DynamicIcon } from './Icons';
import SafeImage from './SafeImage';

export default function BlogCard({ post, onClick }) {
  const { title, excerpt, author, category, readTime, likes, commentCount, coverImage, createdAt } =
    post;

  return (
    <div
      className="ns-blog-card mag-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick(post.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(post.id);
        }
      }}
    >
      <div className="ns-blog-card-image">
        <SafeImage src={coverImage} alt={title} fallbackType="project" fill />
        <span className="ns-blog-category-badge">{category}</span>
      </div>
      <div className="ns-blog-card-content">
        <div className="ns-blog-card-meta">
          <span className="author-name">@{author.name}</span>
          <span className="dot">•</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="ns-blog-card-title">{title}</h3>
        <p className="ns-blog-card-excerpt">{excerpt}</p>
        <div className="ns-blog-card-footer">
          <div className="stats-group">
            <span title="Read Time">
              <DynamicIcon name="Timer" size={14} /> {readTime} min
            </span>
            <span title="Likes">
              <DynamicIcon name="Heart" size={14} /> {likes}
            </span>
            <span title="Comments">
              <DynamicIcon name="MessageCircle" size={14} /> {commentCount}
            </span>
          </div>
          <button className="read-more-btn" aria-label={`Read more: ${title}`}>
            <DynamicIcon name="ArrowRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
