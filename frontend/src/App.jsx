import { useState, useEffect, useRef } from 'react';
import FlowchartColumn from './components/FlowchartColumn';
import PromptColumn from './components/PromptColumn';
import ResponseColumn from './components/ResponseColumn';
import InputTokensPanel from './components/InputTokensPanel';
import ComputeProbsPanel from './components/ComputeProbsPanel';
import SelectTokenPanel from './components/SelectTokenPanel';
import StopContinuePanel from './components/StopContinuePanel';

const BACKEND_BASE_URL = 'http://localhost:8000';

function App() {
  // Input parameters
  const [prompt, setPrompt] = useState('The capital of Indonesia is');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Keep responses short.');
  const [maxTokens, setMaxTokens] = useState(20);
  const [topLogprobs, setTopLogprobs] = useState(10);

  // Playback parameters
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // 1200ms -> 600ms -> 200ms

  // State machine: 'idle' | 'fetching' | 'animating' | 'done'
  const [state, setState] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // API response data
  const [promptTokens, setPromptTokens] = useState([]);
  const [steps, setSteps] = useState([]);

  // Animation step progress
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Sub-states: 'compute_probs' | 'select_token' | 'stop_or_continue' | 'input_tokens'
  const [currentSubState, setCurrentSubState] = useState('compute_probs');

  // Ref to store timer interval
  const timerRef = useRef(null);

  // Derive values for components
  const subStateDuration = playbackSpeed / 4;

  // 1. Debounced Tokenizer for Real-time user input chips
  useEffect(() => {
    if (state !== 'idle') return;

    const delayDebounce = setTimeout(() => {
      const tokenize = async () => {
        let finalPrompt = prompt;
        if (systemPrompt.trim()) {
          finalPrompt = `<|im_start|>system\n${systemPrompt.trim()}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
        }
        if (!finalPrompt.trim()) {
          setPromptTokens([]);
          return;
        }
        try {
          const res = await fetch(`${BACKEND_BASE_URL}/api/tokenize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt })
          });
          if (res.ok) {
            const data = await res.json();
            setPromptTokens(data);
          } else {
            generateMockPromptTokens(finalPrompt);
          }
        } catch (err) {
          generateMockPromptTokens(finalPrompt);
        }
      };
      tokenize();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [prompt, systemPrompt, state]);

  // Local fallback tokenizer if backend is loading or unreachable
  const generateMockPromptTokens = (text) => {
    // Split text keeping spaces as tokens
    const words = text.split(/(\s+)/);
    const tokens = words.filter(w => w !== '').map((w, idx) => ({
      token_display: w,
      token_raw: w,
      token_id: Math.abs(hashString(w)) % 50000 + 10
    }));
    setPromptTokens(tokens);
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  // Derive accumulated generated tokens based on current animation state
  const getGeneratedTokens = () => {
    if (state === 'idle' || state === 'fetching' || steps.length === 0) return [];
    
    let limit = 0;
    if (state === 'done') {
      limit = steps.length;
    } else {
      // If animating: include the token of the current step ONLY in the 'input_tokens' phase
      if (currentSubState === 'input_tokens') {
        limit = currentStepIndex + 1;
      } else {
        limit = currentStepIndex;
      }
    }

    return steps.slice(0, limit)
      .filter(step => !step.is_stop)
      .map((step, idx) => {
        const display = step.selected_token;
        return {
          token_display: display,
          token_raw: display,
          token_id: step.candidates?.[0]?.token === display ? (idx + 50000) : (idx + 60000),
          isGenerated: true
        };
      });
  };

  const generatedTokens = getGeneratedTokens();

  // Derive output text based on current animation state
  const getResponseText = () => {
    if (state === 'idle' || state === 'fetching') return '';
    return generatedTokens.map(t => t.token_display).join('');
  };

  const responseText = getResponseText();

  // Fetch full steps from backend
  const fetchGeneration = async (shouldStartPlaying = false) => {
    setState('fetching');
    setErrorMsg('');
    setSteps([]);
    setCurrentStepIndex(0);
    setCurrentSubState('compute_probs');

    // Combine user prompt with system prompt if active
    let finalPrompt = prompt;
    if (systemPrompt.trim()) {
      finalPrompt = `<|im_start|>system\n${systemPrompt.trim()}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          max_tokens: maxTokens,
          top_logprobs: topLogprobs
        })
      });

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (_) {}
        throw new Error(errData.detail || errData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Keep real tokenized prompt from generate endpoint to match exactly
      if (data.prompt_tokens) {
        setPromptTokens(data.prompt_tokens);
      }
      setSteps(data.steps || []);

      if (!data.steps || data.steps.length === 0) {
        setState('done');
        setIsPlaying(false);
      } else {
        setState('animating');
        setCurrentStepIndex(0);
        setCurrentSubState('compute_probs');
        if (shouldStartPlaying) {
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'API request failed. Make sure backend is running.');
      setState('idle');
      setIsPlaying(false);
    }
  };

  // Playback timer loop: compute_probs -> select_token -> stop_or_continue -> input_tokens
  useEffect(() => {
    if (state !== 'animating' || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentSubState((prev) => {
        if (prev === 'compute_probs') return 'select_token';
        if (prev === 'select_token') return 'stop_or_continue';
        if (prev === 'stop_or_continue') return 'input_tokens';
        
        // At input_tokens, check if we move to next step or finish
        const currentStep = steps[currentStepIndex];
        const isLastStep = currentStepIndex >= steps.length - 1;
        
        if (currentStep?.is_stop || isLastStep) {
          setState('done');
          setIsPlaying(false);
          clearInterval(timerRef.current);
          return 'input_tokens'; // stay in input_tokens as final state
        } else {
          setCurrentStepIndex((idx) => idx + 1);
          return 'compute_probs';
        }
      });
    }, subStateDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, isPlaying, currentStepIndex, steps, subStateDuration]);

  // Handle Play/Pause button
  const handlePlay = () => {
    if (state === 'idle') {
      fetchGeneration(true);
    } else if (state === 'done') {
      fetchGeneration(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Handle Step button (manually advance substate or step index)
  const handleStep = async () => {
    if (state === 'idle' || state === 'done') {
      await fetchGeneration(false);
      return;
    }

    if (state === 'animating') {
      setIsPlaying(false); // Pause autoplay if running

      if (currentSubState !== 'input_tokens') {
        // Fast forward the current step to input_tokens (commit it to context/response text)
        setCurrentSubState('input_tokens');
      } else {
        // We are already at input_tokens of current step. Move to next step's compute_probs
        const currentStep = steps[currentStepIndex];
        const isLastStep = currentStepIndex >= steps.length - 1;

        if (currentStep?.is_stop || isLastStep) {
          setState('done');
        } else {
          setCurrentStepIndex((idx) => idx + 1);
          setCurrentSubState('input_tokens'); // Instantly commit next step's token
        }
      }
    }
  };

  // Handle Speed toggle: 1200ms -> 600ms -> 200ms
  const handleToggleSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1200) return 600;
      if (prev === 600) return 200;
      return 1200;
    });
  };

  // Handle Restart button
  const handleRestart = () => {
    setIsPlaying(false);
    setState('idle');
    // Don't clear promptTokens completely, let debouncer re-tokenize prompt on restart
    setSteps([]);
    setCurrentStepIndex(0);
    setCurrentSubState('compute_probs');
    setErrorMsg('');
  };

  // Determine current active step data to send to sub-panels
  const getActiveStepForProbs = () => {
    if (state === 'idle' || state === 'fetching' || steps.length === 0) return null;
    let index = currentStepIndex;
    if (state === 'done') index = steps.length - 1;
    return index >= 0 ? steps[index] : null;
  };

  const getActiveStepForSelect = () => {
    if (state === 'idle' || state === 'fetching' || steps.length === 0) return null;
    let index = currentStepIndex;
    if (state === 'animating' && currentSubState === 'compute_probs') {
      index = currentStepIndex - 1;
    }
    if (state === 'done') index = steps.length - 1;
    return index >= 0 ? steps[index] : null;
  };

  const getActiveStepForStop = () => {
    if (state === 'idle' || state === 'fetching' || steps.length === 0) return null;
    let index = currentStepIndex;
    if (state === 'animating' && (currentSubState === 'compute_probs' || currentSubState === 'select_token')) {
      index = currentStepIndex - 1;
    }
    if (state === 'done') index = steps.length - 1;
    return index >= 0 ? steps[index] : null;
  };

  const activeStepProbs = getActiveStepForProbs();
  const activeStepSelect = getActiveStepForSelect();
  const activeStepStop = getActiveStepForStop();

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 md:p-6 flex flex-col justify-start">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
              <span className="bg-brand-teal text-white p-1 rounded-md mr-2.5 text-base md:text-xl">AV</span>
              Autoregressive Visualizer
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Interactive visualization of LLM generation steps, token selection, and probabilities.
            </p>
          </div>
          
          <div className="mt-3 md:mt-0 flex items-center space-x-3">
            <span className="flex items-center text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-xs">
              <span className={`w-2 h-2 rounded-full mr-2 ${state === 'fetching' ? 'bg-amber-500 animate-pulse' : state === 'animating' ? 'bg-brand-teal animate-pulse' : 'bg-gray-400'}`} />
              Status: <span className="capitalize ml-1 text-gray-800">{state}</span>
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-xs text-red-700">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
            <button type="button" onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-6">
        {/* SECTION 1 — TOP (Prompt + Response + Mini Flowchart) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Prompt Input */}
          <div className="h-full">
            <PromptColumn
              prompt={prompt}
              setPrompt={setPrompt}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              maxTokens={maxTokens}
              setMaxTokens={setMaxTokens}
              topLogprobs={topLogprobs}
              setTopLogprobs={setTopLogprobs}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onStep={handleStep}
              onPlay={handlePlay}
              onToggleSpeed={handleToggleSpeed}
              onRestart={handleRestart}
              state={state}
            />
          </div>

          {/* Column 2: Response */}
          <div className="h-full">
            <ResponseColumn
              text={responseText}
              state={state}
            />
          </div>

          {/* Column 3: Flowchart */}
          <div className="h-full">
            <FlowchartColumn
              currentSubState={state === 'animating' ? currentSubState : null}
            />
          </div>
        </section>

        {/* SECTION 2 — BOTTOM (Four Detail Panels, side by side) */}
        <section className="border-t border-gray-300 pt-6">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Autoregressive Loop Details
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto custom-scrollbar pb-2">
            {/* Panel 1: Input Tokens */}
            <div className="min-w-[260px]">
              <InputTokensPanel
                promptTokens={promptTokens}
                generatedTokens={generatedTokens}
                currentStepIndex={currentStepIndex}
                state={state}
              />
            </div>

            {/* Panel 2: Compute Probabilities */}
            <div className="min-w-[260px]">
              <ComputeProbsPanel
                stepData={activeStepProbs}
              />
            </div>

            {/* Panel 3: Select Token */}
            <div className="min-w-[260px]">
              <SelectTokenPanel
                stepData={activeStepSelect}
              />
            </div>

            {/* Panel 4: Stop or Continue */}
            <div className="min-w-[260px]">
              <StopContinuePanel
                stepData={activeStepStop}
                generatedCount={generatedTokens.length}
                maxTokens={maxTokens}
                totalTokenCount={promptTokens.length + generatedTokens.length}
                state={state}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full mt-8 border-t border-gray-300 pt-4 text-center text-[10px] text-gray-400 font-mono">
        Autoregressive Visualizer • Single Page Web Application • Powered by FastAPI & Tailwind CSS
      </footer>
    </div>
  );
}

export default App;
