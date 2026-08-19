import React from 'react';
import Image from './next-image.jsx';
import defaultAvatar from '../assets/images/placeholders/default-avatar.png';
import defaultProject from '../assets/images/placeholders/default-project.png';

export default function SafeImage({ src, alt, fallbackType = 'project', ...props }) {
  const fallbackSrc = fallbackType === 'avatar' ? defaultAvatar : defaultProject;

  return (
    <Image
      src={src || fallbackSrc}
      alt={alt || 'Image'}
      onError={(e) => {
        e.target.onerror = null; // prevents infinite loop
        e.target.src = fallbackSrc;
      }}
      {...props}
    />
  );
}
