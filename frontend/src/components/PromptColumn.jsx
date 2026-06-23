import React, { useState } from 'react';

const PRESETS = {
  chat: "The capital of Indonesia is",
  code: "def fibonacci(n):\n    # Calculate nth fibonacci number",
  magic: "Once upon a time in a digital neural network,",
  music: "Write a short song lyric about programming in React:"
};

export default function PromptColumn({
  prompt,
  setPrompt,
  systemPrompt,
  setSystemPrompt,
  maxTokens,
  setMaxTokens,
  topLogprobs,
  setTopLogprobs,
  isPlaying,
  playbackSpeed,
  onStep,
  onPlay,
  onToggleSpeed,
  onRestart,
  state // 'idle' | 'fetching' | 'animating' | 'done'
}) {
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'system'
  const [copied, setCopied] = useState(false);

  const applyPreset = (type) => {
    if (state !== 'idle') return;
    setPrompt(PRESETS[type] || '');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isControlsDisabled = state === 'fetching' || state === 'animating';

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
      {/* Tab Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
            activeTab === 'user'
              ? 'bg-white text-brand-teal shadow-xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          User Prompt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
            activeTab === 'system'
              ? 'bg-white text-brand-teal shadow-xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          System Prompt
        </button>
      </div>

      {/* Inputs Section */}
      <div className="flex-1 flex flex-col min-h-[160px] mb-4">
        {activeTab === 'system' && (
          <div className="mb-3 transition-all duration-300">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              System Instructions
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={state !== 'idle'}
              rows={2}
              className="w-full text-xs p-2 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal resize-none disabled:opacity-75"
              placeholder="e.g. You are a helpful assistant. Keep answers brief."
            />
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Prompt Text
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={state !== 'idle'}
            className="flex-1 w-full text-sm p-3 border border-gray-200 rounded-t-md focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal resize-none disabled:opacity-75"
            placeholder="Type your prompt here..."
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-x border-b border-gray-200 rounded-b-md">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => applyPreset('chat')}
                disabled={state !== 'idle'}
                title="Load Chat Prompt Preset"
                className="p-1 text-gray-400 hover:text-brand-teal hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('code')}
                disabled={state !== 'idle'}
                title="Load Code Prompt Preset"
                className="p-1 text-gray-400 hover:text-brand-teal hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('magic')}
                disabled={state !== 'idle'}
                title="Load Story Prompt Preset"
                className="p-1 text-gray-400 hover:text-brand-teal hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('music')}
                disabled={state !== 'idle'}
                title="Load Creative Lyric Preset"
                className="p-1 text-gray-400 hover:text-brand-teal hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={copyToClipboard}
              title="Copy Prompt"
              className="flex items-center text-xs text-gray-400 hover:text-brand-teal transition-colors focus:outline-none"
            >
              {copied ? (
                <span className="text-emerald-500 font-semibold flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Model Parameter Controls */}
      <div className="bg-gray-50 border border-gray-150 rounded-lg p-3.5 mb-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
            <span>Max New Tokens</span>
            <span className="text-brand-teal font-mono">{maxTokens}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            disabled={state !== 'idle'}
            className="w-full accent-brand-teal cursor-pointer disabled:opacity-50"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
            <span>Top Candidates (logprobs)</span>
            <span className="text-brand-teal font-mono">{topLogprobs}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={topLogprobs}
            onChange={(e) => setTopLogprobs(Number(e.target.value))}
            disabled={state !== 'idle'}
            className="w-full accent-brand-teal cursor-pointer disabled:opacity-50"
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button
          type="button"
          onClick={onStep}
          disabled={isControlsDisabled}
          className="flex items-center justify-center py-2 px-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Advance one full token generation step manually"
        >
          <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Step
        </button>

        <button
          type="button"
          onClick={onPlay}
          disabled={state === 'fetching' || (!prompt.trim() && state === 'idle')}
          className={`flex items-center justify-center py-2 px-3 rounded-lg text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
              : 'bg-brand-teal hover:bg-teal-600 active:bg-teal-700'
          }`}
          title={isPlaying ? "Pause autoplay" : "Start autoplay"}
        >
          {isPlaying ? (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Play
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleSpeed}
          className="flex items-center justify-center py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
          title="Cycle speed: 1200ms -> 600ms -> 200ms"
        >
          <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Speed: {playbackSpeed}ms
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="flex items-center justify-center py-2 px-3 border border-brand-coral/30 rounded-lg text-sm font-semibold text-brand-coral bg-brand-coral/5 hover:bg-brand-coral/10 active:bg-brand-coral/20 transition-colors"
          title="Reset prompt visualizer and fields"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m-3 3l-3-3" />
          </svg>
          Restart
        </button>
      </div>
    </div>
  );
}
