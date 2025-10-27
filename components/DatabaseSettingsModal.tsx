import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { generateColumnMapping } from '../services/geminiService';

interface DatabaseSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string, key: string, tableName: string, mapping: Record<string, string> | null) => void;
    onDisconnect: () => void;
    isConnected: boolean;
}

const APP_DATA_FIELDS: Record<string, string> = {
    name: 'Name / Item #',
    class: 'Class',
    containment: 'Containment Procedures',
    description: 'Description',
    imageUrl: 'Image URL',
};

const DEFAULT_COLUMN_MAPPING: Record<string, string> = {
    name: 'name',
    class: 'class',
    containment: 'containment',
    description: 'description',
    imageUrl: 'image_url',
};

const getCreateTableSql = (tableName: string): string => `CREATE TABLE public.${tableName || 'scp_visualizations'} (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  class TEXT,
  containment TEXT,
  description TEXT,
  image_url TEXT
);`;


const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({ isOpen, onClose, onSave, onDisconnect, isConnected }) => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [tableName, setTableName] = useState('');
    
    const [status, setStatus] = useState<'idle' | 'testing' | 'generating_mapping' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [view, setView] = useState<'credentials' | 'mapping' | 'sql_helper'>('credentials');
    const [tableColumns, setTableColumns] = useState<string[]>([]);
    const [currentMapping, setCurrentMapping] = useState<Record<string, string>>({});
    const [sqlCopied, setSqlCopied] = useState(false);


    useEffect(() => {
        if (isOpen) {
            setUrl(localStorage.getItem('scp_viz_supabase_url') || '');
            setKey(localStorage.getItem('scp_viz_supabase_key') || '');
            setTableName(localStorage.getItem('scp_viz_table_name') || 'scp_visualizations');
            setStatus(isConnected ? 'success' : 'idle');
            setError(null);
            setStatusMessage(null);
            setView('credentials');
        }
    }, [isOpen, isConnected]);

    if (!isOpen) return null;

    const handleConnectAndAnalyze = async () => {
        if (!url || !key || !tableName) {
            setError('URL, Anon Key, and Table Name are required.');
            return;
        }
        setStatus('testing');
        setError(null);
        setStatusMessage('Connecting to Supabase...');

        try {
            const testClient = createClient(url, key);
            const { data, error: testError } = await testClient
                .from(tableName)
                .select('*')
                .limit(1);

            if (testError) {
                throw new Error(testError.message);
            }
            
            const columns = data && data.length > 0 ? Object.keys(data[0]) : null;
            
            if (columns) {
                setTableColumns(columns);
                setStatus('generating_mapping');
                setStatusMessage('Connection successful. Analyzing table schema with AI...');
                try {
                    const aiMapping = await generateColumnMapping(columns);
                    setCurrentMapping(aiMapping);
                     if (Object.keys(aiMapping).length === 0) {
                       setStatusMessage('AI could not map columns automatically. Please map them manually.');
                    } else {
                        setStatusMessage('AI mapping created. Please review and save.');
                    }
                    setView('mapping');
                } catch (mappingError) {
                    setError('AI mapping failed. Please map columns manually.');
                    setCurrentMapping({}); // Start with empty mapping on failure
                    setView('mapping');
                }
                 setStatus('idle');
            } else {
                setStatusMessage('Connection successful, but table is empty. Assuming default column names.');
                setStatus('success');
                onSave(url, key, tableName, DEFAULT_COLUMN_MAPPING);
                setTimeout(onClose, 2000);
            }
        } catch (err) {
            setStatus('error');
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Connection failed: ${message}. Ensure credentials are correct and the table exists.`);
            setStatusMessage(null);
        }
    };

    const handleMappingChange = (field: string, column: string) => {
        setCurrentMapping(prev => ({ ...prev, [field]: column }));
    };

    const handleSaveSettings = () => {
        setStatus('success');
        setStatusMessage('Settings saved successfully!');
        onSave(url, key, tableName, currentMapping);
        setTimeout(onClose, 1500);
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(getCreateTableSql(tableName));
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2000);
    };

    const getButtonText = () => {
        switch (status) {
            case 'testing': return 'Connecting...';
            case 'generating_mapping': return 'Analyzing...';
            case 'success': return 'Success!';
            case 'error': return 'Retry';
            case 'idle':
            default: return 'Connect & Analyze Schema';
        }
    };

    const renderCredentialsView = () => (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Database Connection</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="supabase-url" className="block text-sm font-medium text-gray-300 mb-1">Supabase Project URL</label>
                    <input id="supabase-url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-project.supabase.co" className="w-full pl-3 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors duration-200" />
                </div>
                <div>
                    <label htmlFor="supabase-key" className="block text-sm font-medium text-gray-300 mb-1">Supabase Anon Key</label>
                    <input id="supabase-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="your-anon-key" className="w-full pl-3 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors duration-200" />
                </div>
                <div>
                    <label htmlFor="supabase-table" className="block text-sm font-medium text-gray-300 mb-1">Table Name</label>
                    <input id="supabase-table" type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="e.g., scp_visualizations" className="w-full pl-3 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors duration-200" />
                </div>
            </div>
            <div className="mt-4 p-3 bg-gray-900/50 rounded-md text-xs text-gray-400">
                <p>Connect to your Supabase project. We'll analyze your table to map data fields automatically.</p>
                <p className="mt-1">Need to create a table? <button onClick={() => setView('sql_helper')} className="text-red-400 hover:underline">Get the SQL script</button>.</p>
            </div>

            {statusMessage && <div className="mt-4 text-sm text-center text-gray-300">{statusMessage}</div>}
            {error && <div className="mt-2 text-sm text-center text-red-400">{error}</div>}
            
            <div className="mt-6 flex justify-between items-center">
                <button onClick={onDisconnect} className="text-sm text-gray-500 hover:text-red-400 transition-colors">Disconnect</button>
                <button onClick={handleConnectAndAnalyze} disabled={status === 'testing' || status === 'generating_mapping' || status === 'success'} className="bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 min-w-[200px] text-center">
                    {getButtonText()}
                </button>
            </div>
        </>
    );

    const renderMappingView = () => (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Review Column Mapping</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{statusMessage || 'Map the SCP data fields to your table columns.'}</p>
            <div className="space-y-3">
                {Object.entries(APP_DATA_FIELDS).map(([key, label]) => (
                    <div key={key} className="grid grid-cols-2 gap-4 items-center">
                        <label htmlFor={`mapping-${key}`} className="text-gray-300 text-sm font-medium text-right">{label}</label>
                        <select id={`mapping-${key}`} value={currentMapping[key] || ''} onChange={(e) => handleMappingChange(key, e.target.value)} className="w-full py-2 pl-3 pr-8 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors duration-200">
                            <option value="">-- Select Column --</option>
                            {tableColumns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
                <button onClick={() => setView('credentials')} className="text-sm text-gray-500 hover:text-white">Back</button>
                <button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">Save Settings</button>
            </div>
        </>
    );

    const renderSqlHelperView = () => (
        <>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Create Table SQL</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Copy and run this query in your Supabase SQL editor to create a compatible table.</p>
            <pre className="bg-gray-900 p-4 rounded-md text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                <code>{getCreateTableSql(tableName)}</code>
            </pre>
            <div className="mt-6 flex justify-between items-center">
                 <button onClick={() => setView('credentials')} className="text-sm text-gray-500 hover:text-white">Back</button>
                 <button onClick={handleCopySql} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 min-w-[120px]">
                    {sqlCopied ? 'Copied!' : 'Copy SQL'}
                </button>
            </div>
        </>
    )

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                {view === 'credentials' && renderCredentialsView()}
                {view === 'mapping' && renderMappingView()}
                {view === 'sql_helper' && renderSqlHelperView()}
            </div>
        </div>
    );
};

export default DatabaseSettingsModal;