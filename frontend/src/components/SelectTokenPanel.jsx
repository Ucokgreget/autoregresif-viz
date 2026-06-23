import React from 'react';

export default function SelectTokenPanel({ stepData }) {
  const selectedToken = stepData?.selected_token;

  let displayToken = selectedToken;
  let isNoSelection = !selectedToken;

  if (selectedToken === '\n') {
    displayToken = '↵ (newline)';
  } else if (selectedToken === '\t') {
    displayToken = '⇥ (tab)';
  } else if (selectedToken === ' ') {
    displayToken = '␣ (space)';
  } else if (selectedToken && selectedToken.startsWith(' ')) {
    displayToken = '␣' + selectedToken.slice(1);
  }

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-xs h-full min-h-[300px]">
      <div className="border-b border-gray-100 pb-2 mb-3">
        <h3 className="text-sm font-bold text-brand-coral uppercase tracking-wider">
          Select Token
        </h3>
      </div>

      {/* Sampling Strategy Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-2.5 mb-4 text-[11px] text-blue-700 leading-relaxed">
        <div className="font-semibold mb-0.5 flex items-center">
          <svg className="w-3.5 h-3.5 mr-1 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Greedy Sampling Active
        </div>
        Always selects the highest-probability token from the predicted distribution.
      </div>

      {/* Giant Selected Token Display */}
      <div className="flex-1 flex flex-col justify-center items-center py-2 min-h-[120px]">
        {isNoSelection ? (
          <div className="text-xs text-gray-400 italic text-center">
            No token selected
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">
              Selected Token
            </span>
            <div className="px-5 py-4 bg-teal-50 border border-brand-teal/30 rounded-xl shadow-xs text-center min-w-[120px] transition-all duration-300">
              <span className="text-2xl font-bold font-mono text-brand-teal break-all select-all">
                {displayToken}
              </span>
            </div>
            {stepData?.candidates?.[0] && (
              <span className="text-[10px] font-mono text-gray-500 mt-2">
                Prob: {(stepData.candidates[0].probability * 100).toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
