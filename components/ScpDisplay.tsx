
import React, { useState } from 'react';
import type { ScpData } from '../types';

interface ScpDisplayProps {
    data: ScpData;
    onSave: (scpData: ScpData) => Promise<void>;
}

const DataField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="mb-4">
        <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider mb-1">{label}</h3>
        <p className="text-gray-300 text-base">{value}</p>
    </div>
);


const ScpDisplay: React.FC<ScpDisplayProps> = ({ data, onSave }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(data);
        } catch (error) {
            console.error("Failed to save SCP:", error);
            // In a real app, you might show a toast notification here
        } finally {
            setIsSaving(false);
        }
    };

    const renderSaveButton = () => {
        if (data.isSaved) {
            return (
                <div className="flex items-center gap-2 text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm">Saved to Database</span>
                </div>
            );
        }

        return (
             <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center min-w-[110px]"
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
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
                        <svg className="w-10 h-10 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.611 3.732 2.184-2.183a1 1 0 0 1 1.414 0l3.292 3.292a1 1 0 0 1 .083 1.481l-1.002 1.001Z"/>
                        </svg>
                    </div>
                )}
                <img
                    src={data.imageUrl}
                    alt={`Artistic rendering of ${data.name}`}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                />
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-1">{data.name}</h2>
                <p className="text-lg text-gray-400 mb-4">Object Class: {data.class}</p>
                <div className="border-t border-gray-700 my-4"></div>
                <div className="flex-grow">
                    <DataField label="Containment Procedures" value={data.containment} />
                    <DataField label="Description" value={data.description} />
                </div>
                <div className="border-t border-gray-700 mt-auto pt-4 flex justify-end">
                    {renderSaveButton()}
                </div>
            </div>
        </div>
    );
};

export default ScpDisplay;