import React from 'react';

export default function ComputeProbsPanel({ stepData }) {
  // If no step data or no candidates, show placeholder
  const candidates = stepData?.candidates ? stepData.candidates.slice(0, 10) : [];
  const selectedToken = stepData?.selected_token;

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-xs h-full min-h-[300px]">
      <div className="border-b border-gray-100 pb-2 mb-3">
        <h3 className="text-sm font-bold text-brand-coral uppercase tracking-wider">
          Compute Probabilities
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[220px]">
        {candidates.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center mt-8">
            No probabilities computed yet.
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map((cand, idx) => {
              const isSelected = cand.token === selectedToken;
              const percentage = (cand.probability * 100).toFixed(2);
              
              // Clean whitespace display
              let displayName = cand.token;
              if (displayName === '\n') {
                displayName = '↵ (newline)';
              } else if (displayName === ' ') {
                displayName = '␣ (space)';
              } else if (displayName.startsWith(' ')) {
                displayName = '␣' + displayName.slice(1);
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col p-1.5 rounded transition-all duration-200 ${
                    isSelected
                      ? 'bg-teal-50/50 border border-brand-teal/30 shadow-xs ring-1 ring-brand-teal/10'
                      : 'border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className={`font-semibold ${isSelected ? 'text-brand-teal font-bold' : 'text-gray-700'}`}>
                      {displayName} {isSelected && '✓'}
                    </span>
                    <span className={`${isSelected ? 'text-brand-teal font-bold' : 'text-gray-500'}`}>
                      {percentage}%
                    </span>
                  </div>
                  
                  {/* Probability Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded overflow-hidden">
                    <div
                      style={{ width: `${Math.max(0.5, percentage)}%` }}
                      className={`h-full rounded transition-all duration-500 ${
                        isSelected
                          ? 'bg-gradient-to-r from-teal-400 to-brand-teal'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
