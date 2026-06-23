import React, { useState } from 'react';

export default function InputTokensPanel({ promptTokens = [], generatedTokens = [], currentStepIndex, state }) {
  const [subTab, setSubTab] = useState('tokens'); // 'tokens' | 'ids'

  // Combine prompt tokens and generated tokens
  const allTokens = [...promptTokens];
  
  // For each generation step that has already run, we append its selected token.
  // Wait, let's look at how generatedTokens is structured. Let's say generatedTokens is an array of:
  // { token_display, token_raw, token_id, stepIndex }
  generatedTokens.forEach((t) => {
    allTokens.push(t);
  });

  const totalTokens = allTokens.length;

  const isSpecialToken = (tokenStr) => {
    if (!tokenStr) return false;
    const clean = tokenStr.trim();
    return clean.startsWith('<|') && clean.endsWith('|>');
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-xs h-full min-h-[300px]">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
        <h3 className="text-sm font-bold text-brand-coral uppercase tracking-wider">
          Input Tokens
        </h3>
        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">
          Current: {totalTokens} / 2048
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 p-0.5 rounded-md mb-3 self-start text-[10px] font-semibold">
        <button
          type="button"
          onClick={() => setSubTab('tokens')}
          className={`px-2.5 py-1 rounded-md transition-all ${
            subTab === 'tokens' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-500'
          }`}
        >
          Tokens
        </button>
        <button
          type="button"
          onClick={() => setSubTab('ids')}
          className={`px-2.5 py-1 rounded-md transition-all ${
            subTab === 'ids' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-500'
          }`}
        >
          IDs
        </button>
      </div>

      {/* Chip Stream Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[220px]">
        {allTokens.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center mt-8">
            No tokens loaded. Enter a prompt and click Step/Play.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 content-start">
            {allTokens.map((item, idx) => {
              const isSpecial = isSpecialToken(item.token_raw || item.token_display);
              
              // Determine if this is the active/newly added token (the very last token in the array during animation)
              const isLatest = idx === allTokens.length - 1 && state === 'animating';

              let chipStyle = '';
              if (isLatest) {
                chipStyle = 'bg-brand-teal text-white border-brand-teal';
              } else if (isSpecial) {
                chipStyle = 'border border-dashed border-purple-400 text-purple-600 bg-purple-50';
              } else if (item.isGenerated) {
                chipStyle = 'bg-teal-50 text-brand-teal border border-brand-teal/20';
              } else {
                chipStyle = 'bg-gray-100 text-gray-800 border border-transparent';
              }

              // Display value based on sub-tab
              const displayVal = subTab === 'tokens' 
                ? (item.token_display || item.token_raw || '').replace(/[\n\t]/g, '↵') 
                : item.token_id;

              return (
                <div
                  key={idx}
                  className={`text-xs px-2 py-0.5 rounded font-mono transition-all duration-200 select-all ${chipStyle}`}
                  title={`Raw: "${item.token_raw}" | ID: ${item.token_id}`}
                >
                  {displayVal || ' '}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
