
import React from 'react';

interface ErrorMessageProps {
    message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[450px] bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center text-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-red-200">Error Occurred</h3>
            <p className="mt-2">{message}</p>
        </div>
    );
};

export default ErrorMessage;
