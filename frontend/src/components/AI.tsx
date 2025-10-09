import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function AI() {
    const navigate = useNavigate();
    const [input, setInput] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('AI form submitted with input:', input);
        setLoading(true);
        setError(null);
        
        try {
            const BACKEND = import.meta.env.VITE_BACKEND_URL ?? '';
            const response = await fetch(`${BACKEND}/api/ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }
            
            const data = await response.json();
            setOutput(data.response);
            setInput(''); // Clear input after successful submission
        } catch (err: unknown) {
            console.error('AI fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to AI service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='ai-container'>
            <button 
                onClick={() => navigate('/')} 
                className="back-button">
                Back
            </button>
            <h2>AI Assistant</h2>
            <p>Ask me anything about Islam, and I'll provide helpful answers based on Islamic knowledge.</p>
            
            <form onSubmit={handleSubmit} className="ai-form">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about Islam..."
                    className="ai-textarea"
                    rows={4}
                    required
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    className="ai-button"
                    disabled={loading || !input.trim()}
                >
                    {loading ? 'Processing...' : 'Ask'}
                </button>
            </form>
            
            {error && (
                <div className="ai-error">
                    <p className="error-text">{error}</p>
                </div>
            )}
            
            {output && (
                <div className="ai-output">
                    <h3>Response:</h3>
                    <p>{output}</p>
                </div>
            )}
        </div>
    );
}

export default AI;