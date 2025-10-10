import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

type Ayah = {
    number: number;
    text: string;
    numberInSurah: number;
};

type Surah = {
    number: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
    ayahs: Ayah[];
};

function QuranReader() {
    const navigate = useNavigate();
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
    const [verses, setVerses] = useState<Ayah[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const versesRef = useRef<HTMLDivElement>(null);

    const fetchQuran = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // ✅ Use HTTPS to avoid mixed content issues
            const response = await fetch('https://api.alquran.cloud/v1/quran/en.asad');

            if (!response.ok) {
                throw new Error('Failed to fetch Quran data');
            }

            const data = await response.json();

            // Safety: ensure data exists
            if (!data?.data?.surahs) {
                throw new Error('Invalid API response structure');
            }

            setSurahs(data.data.surahs);
        } catch (err) {
            setError("Failed to fetch Surahs. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuran();
    }, [fetchQuran]);

    const handleSurahSelect = (surahNumber: number) => {
        setSelectedSurah(surahNumber);
        const selectedSurahData = surahs.find(surah => surah.number === surahNumber);
        if (selectedSurahData) {
            setVerses(selectedSurahData.ayahs);
        }
    };

    return (
        <div className="quran-reader-container">
            <button 
                onClick={() => navigate('/')} 
                className="back-button">
                Go Back
            </button>
            
            <h2>Quran Reader</h2>
            
            {loading && <p>Loading Quran...</p>}
            {error && <p className="error-text">{error}</p>}
            
            {!selectedSurah ? (
                <div className="surah-list">
                    <h3 className='surah-header'>Select a Surah</h3>
                    <br />
                    {surahs.map((surah) => (
                        <div 
                            key={surah.number}
                            className="surah-item"
                            onClick={() => handleSurahSelect(surah.number)}
                        >
                            <h4>{surah.number}. {surah.englishName}</h4>
                            <p>{surah.name} - {surah.numberOfAyahs} verses</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="verses-container">
                    <button 
                        onClick={() => setSelectedSurah(null)}
                        className="prayer-times-button"
                    >
                        Back to Surahs
                    </button>
                    
                    <h3>{surahs.find(s => s.number === selectedSurah)?.englishName}</h3>
                    
                    <div ref={versesRef} className="verses">
                        {verses.map((verse) => (
                            <div key={verse.number} className="verse">
                                <span className="verse-number">{verse.numberInSurah}.</span>
                                <span className="verse-text">{verse.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuranReader;
