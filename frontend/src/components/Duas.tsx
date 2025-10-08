import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

interface Dua {
  arabic: string;
  translation: string;
}

function Duas() {
  const navigate = useNavigate();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


  const fetchDuas = async (searchQuery: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/duas?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDuas(data.duas || []);
    } catch (err: unknown) {
      console.error('Error fetching duas:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Load all duas on mount
  useEffect(() => {
    fetchDuas();
  }, [BACKEND_URL]);

  // Live search with debounce
  useEffect(() => {
    const timeout = setTimeout(() => fetchDuas(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="duas-container">
      <button onClick={() => navigate('/')} className="back-button">
        Back
      </button>

      <h2>Duas Collection</h2>

      <input
        type="text"
        placeholder="Search duas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="duas-search"
      />

      {loading ? (
        <p>Loading duas...</p>
      ) : error ? (
        <p className="error-text">Error: {error}</p>
      ) : duas.length === 0 ? (
        <p>No duas found.</p>
      ) : (
        <div className="duas-list">
          {duas.map((dua, index) => (
            <div key={index} className="dua-card">
              <p className="dua-arabic">{dua.arabic}</p>
              <p className="dua-translation">{dua.translation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Duas;
