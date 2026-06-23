import React from 'react';

export default function ResponseColumn({ text, state }) {
  const isAnimating = state === 'animating';
  const isFetching = state === 'fetching';

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Response Output
      </div>
      
      <div className="flex-1 relative flex flex-col bg-gray-50 border border-gray-150 rounded-lg p-4 font-sans text-base leading-relaxed overflow-y-auto min-h-[220px]">
        {isFetching && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-xs transition-opacity duration-300">
            {/* Spinning Indicator */}
            <svg className="animate-spin h-8 w-8 text-brand-teal mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-semibold text-gray-500">Querying DeepSeek...</span>
          </div>
        )}

        <div className="flex-1 whitespace-pre-wrap select-all font-mono text-sm text-gray-800 break-words">
          {text ? (
            <span className={isAnimating ? 'cursor-blink' : ''}>
              {text}
            </span>
          ) : (
            !isFetching && <span className="text-gray-400 italic">Response text will appear here token by token...</span>
          )}
        </div>
      </div>
    </div>
  );
}
