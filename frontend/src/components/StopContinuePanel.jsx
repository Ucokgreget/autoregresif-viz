import React from 'react';

export default function StopContinuePanel({
  stepData,
  generatedCount,
  maxTokens,
  totalTokenCount,
  state
}) {
  const isStop = stepData ? stepData.is_stop : false;
  const hasStep = !!stepData;
  const isDone = state === 'done';

  // Highlight Continue if we have a step, and it's not a stop token
  const showContinueActive = hasStep && !isStop && !isDone;
  // Highlight Stop if we have a step and it is a stop token, or the visualizer finished
  const showStopActive = hasStep && (isStop || isDone);

  const selectedToken = stepData?.selected_token || '';
  const isEndTokenMatched = isStop || selectedToken.includes('<|im_end|>') || selectedToken.includes('im_end') || selectedToken.includes('eos');

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-xs h-full min-h-[300px]">
      <div className="border-b border-gray-100 pb-2 mb-3">
        <h3 className="text-sm font-bold text-brand-coral uppercase tracking-wider">
          Stop or continue?
        </h3>
      </div>

      {/* Generation Status Info Card */}
      <div className={`p-3 rounded-lg border mb-4 text-xs font-semibold flex items-center justify-between transition-colors duration-300 ${
        isDone 
          ? (isEndTokenMatched ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700')
          : (state === 'animating' ? 'bg-teal-50 border-teal-200 text-brand-teal' : 'bg-gray-50 border-gray-200 text-gray-400')
      }`}>
        <span className="uppercase tracking-wider text-[10px] font-bold text-gray-500">Execution Status</span>
        <span className="font-bold font-mono">
          {state === 'idle' && 'IDLE'}
          {state === 'fetching' && 'FETCHING...'}
          {state === 'animating' && 'GENERATING'}
          {state === 'done' && (
            isEndTokenMatched ? 'STOPPED (EOS)' : (generatedCount >= maxTokens ? 'STOPPED (LIMIT)' : 'STOPPED')
          )}
        </span>
      </div>

      {/* Stats Cards Stack */}
      <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar max-h-[170px]">
        {/* Max New Tokens */}
        <div className="bg-gray-50 border border-gray-150 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Max New Tokens
            </div>
            <div className="text-xs font-mono text-gray-700 mt-0.5">
              {generatedCount} &lt; {maxTokens}
            </div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${generatedCount >= maxTokens ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        </div>

        {/* Max Context Window */}
        <div className="bg-gray-50 border border-gray-150 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Context Window
            </div>
            <div className="text-xs font-mono text-gray-700 mt-0.5">
              {totalTokenCount} &lt; 2048
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>

        {/* End Token Detection */}
        <div className={`border rounded-lg p-2 flex items-center justify-between transition-colors duration-300 ${
          isEndTokenMatched 
            ? 'bg-red-50 border-red-200' 
            : 'bg-gray-50 border-gray-150'
        }`}>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              End Token Detected
            </div>
            <div className="text-xs font-mono text-gray-700 mt-0.5 truncate max-w-[130px]">
              {selectedToken ? `"${selectedToken.replace('\n', '↵')}"` : 'None'}
            </div>
          </div>
          {isEndTokenMatched ? (
            <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              EOS Match
            </span>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
