
import React from 'react';

const Hero: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[450px] text-center text-gray-500 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="2" />
                <line x1="12" y1="14" x2="12" y2="22" />
                <line x1="12" y1="2" x2="12" y2="10" />
                <line x1="14" y1="12" x2="22" y2="12" />
                <line x1="2" y1="12" x2="10" y2="12" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-300">Secure. Contain. Protect.</h2>
            <p className="mt-2 max-w-md">
                Enter an SCP designation above to retrieve its file from the Foundation's database and generate a safe-for-work artistic rendering.
            </p>
        </div>
    );
};

export default Hero;
