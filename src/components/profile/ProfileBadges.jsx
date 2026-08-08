import React, { useState } from 'react';
import { Award, Share2, Info, Star, Shield, Zap, Target } from 'lucide-react';

const ICONS = {
  Award,
  Star,
  Shield,
  Zap,
  Target,
};

export default function ProfileBadges({ badges }) {
  const [tooltip, setTooltip] = useState(null);

  const handleShare = (badge) => {
    if (navigator.share) {
      navigator
        .share({
          title: `I earned the ${badge.name} badge on NexaSphere!`,
          text: `Check out my new badge: ${badge.name} - ${badge.description}`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      alert(`Share this badge: I earned the ${badge.name} badge on NexaSphere!`);
    }
  };

  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden mt-6">
      <div className="p-5 border-b border-[#2A2A2A] flex items-center gap-2">
        <Award className="h-5 w-5 text-[#CC1111]" />
        <div>
          <h3 className="text-lg font-semibold text-white">Earned Badges</h3>
          <p className="text-sm text-gray-500 mt-1">Recognitions and achievements</p>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const IconComponent = ICONS[badge.icon] || Award;

            return (
              <div
                key={badge.id}
                className="relative bg-[#222222] rounded-xl p-4 border border-[#333333] hover:border-[#CC1111] transition-all group text-center flex flex-col items-center"
                onMouseEnter={() => setTooltip(badge.id)}
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className={`p-3 rounded-full bg-[#1A1A1A] text-[#CC1111] mb-3 ${badge.isCustom ? 'ring-2 ring-purple-500/50' : ''}`}
                >
                  <IconComponent size={32} />
                </div>

                <h4 className="text-white font-medium text-sm leading-tight mb-1">{badge.name}</h4>
                <p className="text-xs text-gray-500">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </p>

                {/* Tooltip */}
                {tooltip === badge.id && (
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-[#0F0F0F] border border-[#2A2A2A] text-xs text-gray-300 rounded shadow-xl pointer-events-none">
                    <div className="flex items-start gap-1.5 mb-1">
                      <Info size={12} className="text-[#CC1111] mt-0.5 shrink-0" />
                      <span className="font-semibold text-white">How earned:</span>
                    </div>
                    {badge.description}
                  </div>
                )}

                {/* Share Button (Shows on hover) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleShare(badge);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-all shadow-md"
                  aria-label={`Share ${badge.name} badge`}
                >
                  <Share2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
