import React from 'react';

export default function FlowchartColumn({ currentSubState }) {
  const nodes = [
    {
      id: 'input_tokens',
      label: 'Input Tokens',
      desc: 'Tokenize prompt and append to context',
    },
    {
      id: 'compute_probs',
      label: 'Compute Probabilities',
      desc: 'Predict next token probability distribution',
    },
    {
      id: 'select_token',
      label: 'Select Token',
      desc: 'Sample the highest probability candidate',
    },
    {
      id: 'stop_or_continue',
      label: 'Stop or continue?',
      desc: 'Check EOS token or max length limit',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        Execution Flowchart
      </div>
      <div className="flex-1 flex flex-col justify-around py-1">
        {nodes.map((node, index) => {
          const isActive = currentSubState === node.id;
          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                className={`relative flex items-start p-3 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? 'border-brand-teal bg-brand-teal/10 shadow-xs ring-1 ring-brand-teal/30'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Visual indicator dot */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 shrink-0 transition-colors duration-300 ${
                    isActive ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <h4
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isActive ? 'text-brand-teal' : 'text-gray-800'
                    }`}
                  >
                    {node.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {node.desc}
                  </p>
                </div>

                {/* Animated status ring */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-teal"></span>
                  </span>
                )}
              </div>

              {/* Connecting Arrow */}
              {index < nodes.length - 1 && (
                <div className="flex justify-center my-1">
                  <svg
                    className={`w-4 h-4 transition-colors duration-300 ${
                      isActive ? 'text-brand-teal' : 'text-gray-300'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M19 13l-7 7-7-7"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
