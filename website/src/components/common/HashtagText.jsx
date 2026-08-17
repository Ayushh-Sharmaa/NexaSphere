import React from 'react';
import { Link } from 'react-router-dom';

const HashtagText = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by hashtags, keeping the hashtag in the array
  const parts = text.split(/(#\w+)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(/^#\w+/)) {
          const tag = part.substring(1); // remove '#'
          return (
            <Link
              key={`hashtag-part-${index}-${part}`}
              to={`/search?q=%23${tag}&type=all`}
              className="text-blue-500 hover:text-blue-700 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <React.Fragment key={`hashtag-part-${index}-${part}`}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default HashtagText;
