import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';

export function BannersManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    startTime: '',
    endTime: '',
    isActive: true,
  });

  const fetchBanners = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/banners');
      setBanners(res.banners || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify(formState),
      });
      fetchBanners();
      setFormState({
        title: '',
        imageUrl: '',
        linkUrl: '',
        startTime: '',
        endTime: '',
        isActive: true,
      });
    } catch (e) {
      console.error(e);
      alert('Error saving banner');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await fetchWithAuth(`/api/admin/banners/${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (e) {
      console.error(e);
      alert('Error deleting banner');
    }
  };

  return (
    <div className="manager-page p-6">
      <h1 className="text-2xl font-bold mb-4">Banner & Hero Image Management</h1>

      <div className="card mb-6 p-4 border rounded">
        <h2 className="text-xl mb-4">Upload / Create Banner</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
          <input
            type="text"
            placeholder="Banner Title"
            required
            className="input-field border p-2"
            value={formState.title}
            onChange={(e) => setFormState({ ...formState, title: e.target.value })}
          />
          <input
            type="url"
            placeholder="Image URL"
            required
            className="input-field border p-2"
            value={formState.imageUrl}
            onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
          />
          <input
            type="url"
            placeholder="Target Link URL (optional)"
            className="input-field border p-2"
            value={formState.linkUrl}
            onChange={(e) => setFormState({ ...formState, linkUrl: e.target.value })}
          />
          <div>
            <label className="block text-sm mb-1">Start Time (optional)</label>
            <input
              type="datetime-local"
              className="input-field border p-2 w-full"
              value={formState.startTime}
              onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End Time (optional)</label>
            <input
              type="datetime-local"
              className="input-field border p-2 w-full"
              value={formState.endTime}
              onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
            />
            Active
          </label>
          <button type="submit" className="btn btn-primary bg-blue-600 text-white p-2 rounded">
            Save Banner
          </button>
        </form>
      </div>

      <div className="card p-4 border rounded">
        <h2 className="text-xl mb-4">Existing Banners</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="border p-4 rounded shadow-sm">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-32 object-cover mb-2 rounded"
                />
                <h3 className="font-bold">{b.title}</h3>
                <p className="text-sm text-gray-600">
                  Status: {b.isActive ? 'Active' : 'Inactive'}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="btn text-red-600 border border-red-600 p-1 rounded text-sm"
                  >
                    Delete / Archive
                  </button>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p>No banners found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
