import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    confirmingText?: string;
    isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = 'Confirm',
    confirmingText = 'Confirming...',
    isConfirming = false,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={isConfirming ? undefined : onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl leading-none disabled:opacity-50"
                        aria-label="Close"
                        disabled={isConfirming}
                    >
                        &times;
                    </button>
                </div>
                <div className="text-gray-300">
                    {children}
                </div>
                <div className="mt-6 flex justify-end items-center gap-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isConfirming}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center min-w-[140px]"
                    >
                        {isConfirming ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {confirmingText}
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
