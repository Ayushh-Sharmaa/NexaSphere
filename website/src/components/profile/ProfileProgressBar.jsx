import React from 'react';

export default function ProfileProgressBar({ profile }) {
  if (!profile) return null;

  // Calculate completion percentage
  let score = 0;
  const maxScore = 5;

  if (profile.fullName || profile.name) score += 1;
  if (profile.email) score += 1;
  if (profile.bio) score += 1;
  if (profile.avatar) score += 1;

  if (profile.socialLinks) {
    if (
      profile.socialLinks.github ||
      profile.socialLinks.linkedin ||
      profile.socialLinks.portfolio
    ) {
      score += 1;
    }
  }

  const percentage = Math.round((score / maxScore) * 100);

  let colorClass = 'bg-red-500';
  if (percentage >= 50) colorClass = 'bg-yellow-500';
  if (percentage >= 80) colorClass = 'bg-green-500';
  if (percentage === 100) colorClass = 'bg-indigo-500';

  return (
    <div className="bg-[#1e293b] rounded-xl p-4 border border-white/10 mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-white">Profile Completion</span>
        <span className="text-sm font-bold text-white/80">{percentage}%</span>
      </div>
      <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5">
        <div
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {percentage < 100 && (
        <p className="text-xs text-white/50 mt-3">
          Complete your profile to stand out! {!profile.bio && 'Add a bio. '}{' '}
          {!profile.avatar && 'Upload a profile picture. '}{' '}
          {(!profile.socialLinks ||
            (!profile.socialLinks.github && !profile.socialLinks.linkedin)) &&
            'Add your GitHub or LinkedIn links.'}
        </p>
      )}
    </div>
  );
}
