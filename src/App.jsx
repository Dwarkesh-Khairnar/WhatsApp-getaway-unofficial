import React, { useState, useEffect } from 'react';

const API_BASE = '/api';
const API_KEY = 'hgsw6332edderf4'; // Change this safely in production env

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [newSessionId, setNewSessionId] = useState('');

  const fetchSessions = async () => {
    const res = await fetch(`${API_BASE}/sessions`, { headers: { 'x-api-key': API_KEY } });
    const data = await res.json();
    setSessions(data);
  };

  const startSession = async () => {
    if (!newSessionId) return;
    await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ sessionId: newSessionId }),
    });
    setNewSessionId('');
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <header className="border-b border-gray-800 pb-4 mb-8">
        <h1 className="text-3xl font-extrabold text-green-400">⚡ WhatsApp Gateway Core</h1>
        <p className="text-gray-400 text-sm">Self-hosted custom enterprise session control engine.</p>
      </header>

      <div className="bg-gray-800 p-6 rounded-lg mb-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">Launch New Device Unit</h2>
        <div className="flex gap-4">
          <input 
            type="text" placeholder="Instance unique custom name"
            value={newSessionId} onChange={(e) => setNewSessionId(e.target.value)}
            className="bg-gray-700 px-4 py-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={startSession} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-black font-bold transition">
            Initialize
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((s) => (
          <div key={s.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-mono font-bold text-blue-400">{s.id}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'CONNECTED' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                {s.status}
              </span>
            </div>
            {s.qr ? (
              <div className="bg-white p-4 rounded flex flex-col items-center">
                <img src={s.qr} alt="Scan QR Code" className="w-48 h-48" />
                <p className="text-black text-xs font-bold mt-2">Scan from Link Devices window</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">{s.status === 'CONNECTED' ? '🚀 Active and ready' : 'No pairing token requested.'}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}