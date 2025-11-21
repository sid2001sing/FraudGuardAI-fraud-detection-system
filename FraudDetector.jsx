import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Activity, Server, Database, ArrowRight, RefreshCcw } from 'lucide-react';

export default function FraudDetector() {
  const [mode, setMode] = useState('simulation'); // 'simulation' or 'live'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Form State matching the Python model features
  const [formData, setFormData] = useState({
    distance_from_home: 50,
    distance_from_last_transaction: 5,
    ratio_to_median_purchase_price: 1.0,
    repeat_retailer: 1,
    used_chip: 1,
    used_pin_number: 1,
    online_order: 0
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : parseFloat(value)
    }));
  };

  // --- LOGIC ---

  // 1. Simulation Logic (Runs in browser if no backend is present)
  const simulatePrediction = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Replicating the Python logic roughly for the demo
        let score = 0;
        if (formData.ratio_to_median_purchase_price > 8) score += 40;
        if (formData.distance_from_home > 100) score += 20;
        if (formData.online_order === 1) score += 15;
        if (formData.used_chip === 0) score += 25;
        
        // Add randomness
        const probability = Math.min(0.99, (score + Math.random() * 10) / 100);
        const is_fraud = probability > 0.6 ? 1 : 0;
        
        resolve({
          is_fraud,
          fraud_probability: probability,
          status: is_fraud ? "FRAUD DETECTED" : "Transaction Clean",
          source: "Simulation (Browser JS)"
        });
      }, 1500);
    });
  };

  // 2. Live API Call Logic
  const callApiPrediction = async () => {
    try {
      // Connect to the Express Server on Port 5000
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return { ...data, source: "Live API (Python Model)" };
    } catch (error) {
      throw new Error("Could not connect to localhost:5000. Ensure the Express server is running.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let data;
      if (mode === 'simulation') {
        data = await simulatePrediction();
      } else {
        data = await callApiPrediction();
      }
      setResult(data);
    } catch (error) {
      alert(error.message);
      setMode('simulation'); // Fallback to simulation if server fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FraudGuard AI</h1>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-lg font-semibold text-slate-300">Transaction Details</h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className={mode === 'live' ? "text-green-400" : "text-slate-500"}>Live API</span>
                <button 
                  onClick={() => setMode(mode === 'simulation' ? 'live' : 'simulation')}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${mode === 'live' ? 'bg-green-600' : 'bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${mode === 'live' ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className={mode === 'simulation' ? "text-blue-400" : "text-slate-500"}>Simulation</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dist. from Home (km)</label>
                  <input type="number" name="distance_from_home" value={formData.distance_from_home} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dist. from Last Txn (km)</label>
                  <input type="number" name="distance_from_last_transaction" value={formData.distance_from_last_transaction} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ratio to Median Price</label>
                  <input type="number" step="0.1" name="ratio_to_median_purchase_price" value={formData.ratio_to_median_purchase_price} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-blue-500 outline-none" />
                  <div className="text-xs text-slate-500 mt-1">E.g. 5.0 means transaction is 5x normal size</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-900 rounded border border-slate-700 hover:border-slate-500 transition">
                  <input type="checkbox" name="used_chip" checked={formData.used_chip === 1} onChange={handleInputChange} className="accent-blue-500" />
                  <span className="text-sm">Used Chip</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-900 rounded border border-slate-700 hover:border-slate-500 transition">
                  <input type="checkbox" name="used_pin_number" checked={formData.used_pin_number === 1} onChange={handleInputChange} className="accent-blue-500" />
                  <span className="text-sm">Used PIN</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-900 rounded border border-slate-700 hover:border-slate-500 transition">
                  <input type="checkbox" name="repeat_retailer" checked={formData.repeat_retailer === 1} onChange={handleInputChange} className="accent-blue-500" />
                  <span className="text-sm">Repeat Retailer</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-900 rounded border border-slate-700 hover:border-slate-500 transition">
                  <input type="checkbox" name="online_order" checked={formData.online_order === 1} onChange={handleInputChange} className="accent-blue-500" />
                  <span className="text-sm">Online Order</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-blue-900/50 flex justify-center items-center space-x-2 transition-all"
              >
                {loading ? <RefreshCcw className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                <span>Analyze Transaction</span>
              </button>
            </form>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-sm text-slate-400">
            <h3 className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" /> System Architecture
            </h3>
            <p>1. <strong>React Client</strong> sends JSON payload.</p>
            <p>2. <strong>Express API</strong> receives POST request.</p>
            <p>3. <strong>Python Process</strong> loads <code className="bg-slate-900 px-1 rounded">.pkl</code> model & predicts.</p>
            <p>4. <strong>Result</strong> returned to client.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Visualization */}
        <div className="space-y-6">
          {/* Result Card */}
          <div className={`h-full min-h-[400px] flex flex-col justify-center items-center p-8 rounded-xl border transition-all duration-500 ${
            !result 
              ? 'bg-slate-800/50 border-slate-700 border-dashed' 
              : result.is_fraud 
                ? 'bg-red-900/20 border-red-500/50 shadow-red-900/20 shadow-2xl' 
                : 'bg-emerald-900/20 border-emerald-500/50 shadow-emerald-900/20 shadow-2xl'
          }`}>
            
            {!result && !loading && (
              <div className="text-center text-slate-500">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Waiting for transaction data...</p>
              </div>
            )}

            {loading && (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-blue-400 animate-pulse">Running Random Forest Model...</p>
              </div>
            )}

            {result && !loading && (
              <div className="w-full animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-6">
                  {result.is_fraud ? (
                    <div className="bg-red-500/20 p-6 rounded-full ring-2 ring-red-500">
                      <ShieldAlert className="w-16 h-16 text-red-500" />
                    </div>
                  ) : (
                    <div className="bg-emerald-500/20 p-6 rounded-full ring-2 ring-emerald-500">
                      <ShieldCheck className="w-16 h-16 text-emerald-500" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-3xl font-bold text-center mb-2">
                  {result.is_fraud ? <span className="text-red-400">High Fraud Risk</span> : <span className="text-emerald-400">Transaction Safe</span>}
                </h2>
                
                <p className="text-center text-slate-400 mb-8 font-mono text-xs uppercase tracking-widest">
                  {result.status}
                </p>

                <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Fraud Probability</span>
                      <span className="text-white font-mono">{(result.fraud_probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${result.is_fraud ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${result.fraud_probability * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-700/50">
                     <div>
                       <span className="block text-slate-500">Model Used</span>
                       <span className="text-slate-300">RandomForest v1.0</span>
                     </div>
                     <div className="text-right">
                       <span className="block text-slate-500">Data Source</span>
                       <span className="text-blue-400">{result.source}</span>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
