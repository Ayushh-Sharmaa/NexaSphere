import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';

const TrendingHashtags = () => {
  const [hashtags, setHashtags] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth for following feature
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (token && u) {
      try { setUser(JSON.parse(u)); } catch (e) {}
    }

    const fetchTrending = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/hashtags/trending');
        setHashtags(res.hashtags || []);
        
        if (token) {
          const followRes = await apiClient.get('/hashtags/following');
          setFollowing(new Set(followRes.tags || []));
        }
      } catch (err) {
        setError('Failed to load trending hashtags');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const toggleFollow = async (tag) => {
    if (!user) return alert("Please log in to follow hashtags");

    const isFollowing = following.has(tag);
    
    // Optimistic UI update
    setFollowing(prev => {
      const next = new Set(prev);
      if (isFollowing) next.delete(tag);
      else next.add(tag);
      return next;
    });

    try {
      if (isFollowing) {
        await apiClient.delete(`/hashtags/${tag}/follow`);
      } else {
        await apiClient.post(`/hashtags/${tag}/follow`);
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setFollowing(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(tag);
        else next.delete(tag);
        return next;
      });
      alert('Failed to update follow status');
    }
  };

  if (loading && hashtags.length === 0) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  }

  if (hashtags.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🔥</span> Trending Hashtags
      </h3>
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <div className="space-y-4">
        {hashtags.map(({ tag, usage_count }) => (
          <div key={tag} className="flex items-center justify-between group">
            <Link 
              to={`/search?q=%23${tag}&type=all`}
              className="flex-1"
            >
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                #{tag}
              </div>
              <div className="text-xs text-gray-500">
                {usage_count} {usage_count === 1 ? 'post' : 'posts'}
              </div>
            </Link>
            
            <button
              onClick={() => toggleFollow(tag)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                following.has(tag)
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {following.has(tag) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingHashtags;
