import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useSponsorships() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.sponsorships.getAll();
      setSponsors(data?.sponsors ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sponsors, setSponsors, loading, error, reload: load };
}
