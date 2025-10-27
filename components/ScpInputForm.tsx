import React, { useRef } from 'react';

interface ScpInputFormProps {
    scpId: string;
    setScpId: (id: string) => void;
    onSubmit: () => void;
    onCsvImport: (file: File) => void;
    isLoading: boolean;
    disabled: boolean;
}

const ScpInputForm: React.FC<ScpInputFormProps> = ({ scpId, setScpId, onSubmit, onCsvImport, isLoading, disabled }) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onCsvImport(file);
        }
        e.target.value = ''; 
    };
    
    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg shadow-lg flex items-center p-2 focus-within:ring-2 focus-within:ring-red-500/70 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-2 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>

                    <textarea
                        value={scpId}
                        onChange={(e) => setScpId(e.target.value)}
                        placeholder="Enter SCP designations (e.g., SCP-173, SCP-049)..."
                        className="flex-grow w-full bg-transparent border-0 focus:ring-0 resize-none p-2 text-gray-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        rows={1}
                        disabled={disabled}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSubmit();
                            }
                        }}
                    />

                    <div className="flex items-center shrink-0 ml-2">
                        <button
                            type="button"
                            onClick={handleImportClick}
                            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={disabled}
                            title="Import from CSV file"
                            aria-label="Import from CSV file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </button>
                        <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-md transition-all duration-200 flex items-center justify-center shrink-0 ml-2 min-w-[130px]"
                            disabled={disabled}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Visualize'
                            )}
                        </button>
                    </div>
                </div>
            </form>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv, text/csv"
                className="hidden"
                aria-hidden="true"
            />
        </>
    );
};

export default ScpInputForm;