import React, { useState, useCallback, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScpData, ScpError } from './types';
import { generateScpDataAndImage } from './services/geminiService';
import { saveScpData, checkIfScpsExist } from './services/supabaseService';
import ScpInputForm from './components/ScpInputForm';
import ScpDisplay from './components/ScpDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Hero from './components/Hero';
import DatabaseSettingsModal from './components/DatabaseSettingsModal';
import ConfirmationModal from './components/ConfirmationModal';

const DEFAULT_COLUMN_MAPPING: Record<string, string> = {
    name: 'name',
    class: 'class',
    containment: 'containment',
    description: 'description',
    imageUrl: 'image_url',
};

const App: React.FC = () => {
    const [scpId, setScpId] = useState<string>('SCP-173');
    const [scpDataList, setScpDataList] = useState<ScpData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errors, setErrors] = useState<ScpError[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Supabase state
    const [isDbModalOpen, setIsDbModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [dbTableName, setDbTableName] = useState<string | null>(null);
    const [columnMapping, setColumnMapping] = useState<Record<string, string> | null>(null);
    
    useEffect(() => {
        const url = localStorage.getItem('scp_viz_supabase_url');
        const key = localStorage.getItem('scp_viz_supabase_key');
        const table = localStorage.getItem('scp_viz_table_name');
        if (url && key && table) {
            setDbTableName(table);
            const client = createClient(url, key);
            setSupabaseClient(client);

            const storedMapping = localStorage.getItem(`scp_viz_column_mapping_${table}`);
            if (storedMapping) {
                setColumnMapping(JSON.parse(storedMapping));
            } else {
                setColumnMapping(DEFAULT_COLUMN_MAPPING);
            }

            // Simple check to see if we can connect
            client.from(table).select('*', { count: 'exact', head: true }).then(({ error }) => {
                if (!error) {
                    setIsDbConnected(true);
                } else {
                    setIsDbConnected(false);
                    setColumnMapping(null);
                }
            });
        }
    }, []);

    const processScpList = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;

        setIsLoading(true);
        setGlobalError(null);
        setScpDataList([]);
        setErrors([]);
        
        // Check which SCPs are already in the database
        let alreadySavedScps = new Set<string>();
        if (isDbConnected && supabaseClient && dbTableName && columnMapping) {
            const nameColumn = columnMapping.name;
            if (nameColumn) {
                // Fetch existing status for the *names* that will be generated
                const potentialNames = ids.map(id => id.toUpperCase());
                alreadySavedScps = await checkIfScpsExist(supabaseClient, dbTableName, nameColumn, potentialNames);
            }
        }
        
        let successfulGenerations = 0;
        const processedIds = new Set<string>();

        for (const id of ids) {
            const upperCaseId = id.toUpperCase();
            if (processedIds.has(upperCaseId)) continue; // Skip duplicates in input
            processedIds.add(upperCaseId);
            
            if (successfulGenerations > 0) {
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
            
            try {
                const result = await generateScpDataAndImage(id);
                // The name from the wiki might differ slightly (e.g. SCP-173 vs SCP-173 "The Sculpture")
                // A better check would be against the primary designation. We assume result.name is canonical.
                const isSaved = alreadySavedScps.has(result.name);
                
                setScpDataList(prev => [...prev, { ...result, isSaved }]);
                successfulGenerations++;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setErrors(prev => [...prev, { scpId: id, message }]);
            }
        }

        setIsLoading(false);
    }, [isDbConnected, supabaseClient, dbTableName, columnMapping]);

    const handleGenerate = useCallback(async () => {
        if (!isDbConnected) {
            setGlobalError('Please connect to a database first.');
            setIsDbModalOpen(true);
            return;
        }
        const trimmedInput = scpId.trim();
        if (!trimmedInput) {
            setGlobalError('Please enter at least one SCP designation.');
            return;
        }
        const ids = trimmedInput.split(/[\n,]+/).map(id => id.trim()).filter(Boolean);
        
        if (ids.length === 0) {
            setGlobalError('Please enter a valid SCP designation.');
            return;
        }

        processScpList(ids);
    }, [scpId, processScpList, isDbConnected]);

    const handleCsvImport = useCallback((file: File) => {
        if (!isDbConnected) {
            setGlobalError('Please connect to a database first.');
            setIsDbModalOpen(true);
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const ids = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (ids.length > 0) {
                processScpList(ids);
            } else {
                setGlobalError("The imported CSV file is empty or invalid.");
            }
        };
        reader.onerror = () => {
             setGlobalError("Failed to read the imported file.");
        }
        reader.readAsText(file);
    }, [processScpList, isDbConnected]);

    const handleSaveDbSettings = (url: string, key: string, tableName: string, mapping: Record<string, string> | null) => {
        const client = createClient(url, key);
        setSupabaseClient(client);
        setDbTableName(tableName);
        localStorage.setItem('scp_viz_supabase_url', url);
        localStorage.setItem('scp_viz_supabase_key', key);
        localStorage.setItem('scp_viz_table_name', tableName);

        if (mapping) {
            localStorage.setItem(`scp_viz_column_mapping_${tableName}`, JSON.stringify(mapping));
            setColumnMapping(mapping);
        } else {
            localStorage.removeItem(`scp_viz_column_mapping_${tableName}`);
            setColumnMapping(DEFAULT_COLUMN_MAPPING);
        }

        setIsDbConnected(true);
    };

    const handleDisconnect = () => {
        setSupabaseClient(null);
        setIsDbConnected(false);
        setColumnMapping(null);

        const table = localStorage.getItem('scp_viz_table_name');
        if (table) {
            localStorage.removeItem(`scp_viz_column_mapping_${table}`);
        }
        localStorage.removeItem('scp_viz_supabase_url');
        localStorage.removeItem('scp_viz_supabase_key');
        localStorage.removeItem('scp_viz_table_name');
        
        setIsDbModalOpen(false);
    };

    const handleSaveSingle = async (scpToSave: ScpData) => {
        if (!isDbConnected || !supabaseClient || !dbTableName || !columnMapping) {
            setGlobalError('Database not connected. Please connect via settings to save.');
            setIsDbModalOpen(true);
            throw new Error('Database not connected.');
        }
        
        try {
            await saveScpData(supabaseClient, [scpToSave], dbTableName, columnMapping);
            setScpDataList(prevList =>
                prevList.map(item =>
                    item.name === scpToSave.name ? { ...item, isSaved: true } : item
                )
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred during save.';
            setGlobalError(`Failed to save ${scpToSave.name}: ${message}`);
            throw err;
        }
    };
    
    const handleSaveAllUnsaved = async () => {
        if (!isDbConnected || !supabaseClient || !dbTableName || !columnMapping) {
            setGlobalError('Database not connected. Please connect via settings to save.');
            setIsDbModalOpen(true);
            return;
        }
        
        const unsavedItems = scpDataList.filter(item => !item.isSaved);
        if (unsavedItems.length === 0) {
            setGlobalError('No unsaved items to save.');
            return;
        }

        setIsSaving(true);
        setGlobalError(null);

        try {
            await saveScpData(supabaseClient, unsavedItems, dbTableName, columnMapping);
            setScpDataList(prevList =>
                prevList.map(item =>
                    unsavedItems.some(ui => ui.name === item.name) ? { ...item, isSaved: true } : item
                )
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred during save.';
            setGlobalError(`Failed to save all items: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmedSave = async () => {
        await handleSaveAllUnsaved();
        setIsConfirmModalOpen(false);
    };
    
    const hasResults = scpDataList.length > 0 || errors.length > 0;
    const unsavedItems = scpDataList.filter(item => !item.isSaved);
    const hasUnsavedItems = unsavedItems.length > 0;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto relative">
                <div className="absolute top-0 right-0 p-2 z-10">
                    <button
                        onClick={() => setIsDbModalOpen(true)}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-md border transition-colors duration-200 ${
                            isDbConnected
                                ? 'bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20'
                                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                        aria-label="Database Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 8 0 0116 0" /></svg>
                        <span>Database</span>
                        <div className={`h-2 w-2 rounded-full ${isDbConnected ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    </button>
                </div>
                
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-wider pt-8 sm:pt-0">
                        SCP Foundation <span className="text-red-500">Visualizer</span>
                    </h1>
                    <p className="text-gray-400">
                        AI-powered archival and artistic rendering of anomalous entities.
                    </p>
                </header>

                <main className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-2xl shadow-black/30 p-6 border border-gray-700">
                     <div className="relative">
                        <ScpInputForm
                            scpId={scpId}
                            setScpId={setScpId}
                            onSubmit={handleGenerate}
                            onCsvImport={handleCsvImport}
                            isLoading={isLoading}
                            disabled={!isDbConnected || isLoading}
                        />
                         {!isDbConnected && (
                            <div className="absolute inset-0 bg-gray-800/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-20 p-4">
                                <h3 className="text-2xl font-bold text-white mb-4 text-center">Connect to Your Database</h3>
                                <p className="text-gray-400 mb-6 text-center max-w-md">
                                    To begin visualizing and archiving SCPs, please connect to your Supabase project first.
                                </p>
                                <button
                                    onClick={() => setIsDbModalOpen(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-red-500/50"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 8 0 0116 0" /></svg>
                                    Connect Database
                                </button>
                            </div>
                        )}
                    </div>

                    {!isLoading && hasUnsavedItems && (
                        <div className="my-6 flex justify-center">
                            <button
                                onClick={() => setIsConfirmModalOpen(true)}
                                disabled={isSaving || !isDbConnected}
                                title={!isDbConnected ? 'Connect to Database to enable saving' : ''}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-md transition-all duration-200 flex items-center justify-center"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    `Save All Unsaved (${unsavedItems.length})`
                                )}
                            </button>
                        </div>
                    )}

                    <div className="mt-6 min-h-[450px]">
                        {isLoading && !hasResults && <LoadingSpinner />}
                        {globalError && <ErrorMessage message={globalError} />}
                        
                        {errors.length > 0 && (
                            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                                <h3 className="text-lg font-bold text-red-200 mb-2">Processing Failures</h3>
                                <ul className="list-disc list-inside text-red-300 space-y-1">
                                    {errors.map((err, index) => (
                                        <li key={index}>
                                            <span className="font-semibold">{err.scpId}:</span> {err.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {scpDataList.length > 0 && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {scpDataList.map((data) => (
                                    <ScpDisplay key={data.name} data={data} onSave={handleSaveSingle} />
                                ))}
                            </div>
                        )}
                        
                        {isLoading && hasResults && (
                            <div className="mt-6 text-center text-gray-400 flex items-center justify-center">
                                <svg className="animate-spin mr-3 h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing remaining items...
                            </div>
                        )}

                        {!isLoading && !globalError && !hasResults && (
                            <Hero />
                        )}
                    </div>
                </main>
                
                <footer className="text-center mt-8 text-gray-500 text-xs">
                    <p>All content related to the SCP Foundation is licensed under a Creative Commons Attribution-ShareAlike 3.0 License.</p>
                    <p>This is an independent project and is not endorsed by the SCP Foundation.</p>
                </footer>
            </div>
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmedSave}
                    title="Confirm Save to Database"
                    confirmText={`Save ${unsavedItems.length} ${unsavedItems.length === 1 ? 'item' : 'items'}`}
                    isConfirming={isSaving}
                    confirmingText="Saving..."
                >
                    <p className="text-gray-300">
                        You are about to save <span className="font-bold text-white">{unsavedItems.length}</span> unsaved SCP entr{unsavedItems.length === 1 ? 'y' : 'ies'} to the table <span className="font-mono bg-gray-900/50 px-1 py-0.5 rounded text-red-400">{dbTableName}</span>.
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                        This action will insert new rows. Please ensure this is the intended action to avoid duplicate entries.
                    </p>
                </ConfirmationModal>
            )}
            {isDbModalOpen && (
                <DatabaseSettingsModal
                    isOpen={isDbModalOpen}
                    onClose={() => setIsDbModalOpen(false)}
                    onSave={handleSaveDbSettings}
                    onDisconnect={handleDisconnect}
                    isConnected={isDbConnected}
                />
            )}
        </div>
    );
};

export default App;