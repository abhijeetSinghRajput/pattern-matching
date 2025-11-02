import React, { useState, useEffect } from "react";
import { create } from "zustand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ChevronRight,
} from "lucide-react";
import { Slider } from "../ui/slider";

// Zustand store for managing simulator state
const useSimulatorStore = create((set) => ({
  text: "AABAACAADAABAABA",
  pattern: "AABA",
  algorithm: "brute-force",
  isPlaying: false,
  currentStep: 0,
  steps: [],
  matches: [],
  speed: 500,

  setText: (text) => set({ text, currentStep: 0, steps: [], matches: [] }),
  setPattern: (pattern) =>
    set({ pattern, currentStep: 0, steps: [], matches: [] }),
  setAlgorithm: (algorithm) =>
    set({ algorithm, currentStep: 0, steps: [], matches: [] }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setSteps: (steps) => set({ steps }),
  setMatches: (matches) => set({ matches }),
  setSpeed: (speed) => set({ speed }),
  reset: () => set({ currentStep: 0, isPlaying: false }),
}));

// Brute Force Algorithm
function bruteForceSteps(text, pattern) {
  const steps = [];
  const matches = [];
  const n = text.length;
  const m = pattern.length;

  for (let i = 0; i <= n - m; i++) {
    for (let j = 0; j < m; j++) {
      steps.push({
        textIndex: i,
        patternIndex: j,
        comparing: true,
        match: text[i + j] === pattern[j],
        message: `Comparing text[${i + j}]='${
          text[i + j]
        }' with pattern[${j}]='${pattern[j]}'`,
      });

      if (text[i + j] !== pattern[j]) {
        steps.push({
          textIndex: i,
          patternIndex: j,
          comparing: false,
          match: false,
          message: `Mismatch! Shift pattern to next position`,
        });
        break;
      }

      if (j === m - 1) {
        matches.push(i);
        steps.push({
          textIndex: i,
          patternIndex: j,
          comparing: false,
          match: true,
          found: true,
          message: `Match found at position ${i}!`,
        });
      }
    }
  }

  return { steps, matches };
}

// Rabin-Karp Algorithm
function rabinKarpSteps(text, pattern) {
  const steps = [];
  const matches = [];
  const d = 256;
  const q = 101;
  const n = text.length;
  const m = pattern.length;
  let h = 1;
  let p = 0;
  let t = 0;

  for (let i = 0; i < m - 1; i++) {
    h = (h * d) % q;
  }

  for (let i = 0; i < m; i++) {
    p = (d * p + pattern.charCodeAt(i)) % q;
    t = (d * t + text.charCodeAt(i)) % q;
  }

  steps.push({
    message: `Pattern hash: ${p}, Initial text window hash: ${t}`,
    patternHash: p,
    textHash: t,
  });

  for (let i = 0; i <= n - m; i++) {
    steps.push({
      textIndex: i,
      patternIndex: 0,
      comparing: true,
      textHash: t,
      patternHash: p,
      message: `Comparing hashes at position ${i}: text=${t}, pattern=${p}`,
    });

    if (p === t) {
      let match = true;
      for (let j = 0; j < m; j++) {
        steps.push({
          textIndex: i,
          patternIndex: j,
          comparing: true,
          match: text[i + j] === pattern[j],
          message: `Hash match! Verifying character by character: text[${
            i + j
          }]='${text[i + j]}' vs pattern[${j}]='${pattern[j]}'`,
        });

        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }

      if (match) {
        matches.push(i);
        steps.push({
          textIndex: i,
          found: true,
          message: `Pattern found at position ${i}!`,
        });
      }
    }

    if (i < n - m) {
      t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
      if (t < 0) t += q;
      steps.push({
        message: `Rolling hash for next window: ${t}`,
        textHash: t,
      });
    }
  }

  return { steps, matches };
}

// Finite Automata Algorithm
function buildAutomaton(pattern) {
  const m = pattern.length;
  const alphabet = new Set(pattern.split(""));
  const automaton = Array(m + 1)
    .fill(null)
    .map(() => ({}));

  for (let state = 0; state <= m; state++) {
    for (const char of alphabet) {
      let k = Math.min(m, state + 1);
      while (k > 0) {
        const prefix = pattern.substring(0, k);
        const suffix = (pattern.substring(0, state) + char).slice(-k);
        if (prefix === suffix) break;
        k--;
      }
      automaton[state][char] = k;
    }
  }

  return automaton;
}

function finiteAutomataSteps(text, pattern) {
  const steps = [];
  const matches = [];
  const automaton = buildAutomaton(pattern);
  const n = text.length;
  const m = pattern.length;
  let state = 0;

  steps.push({
    message: `Built finite automaton with ${m + 1} states`,
    automaton: JSON.stringify(automaton),
  });

  for (let i = 0; i < n; i++) {
    const char = text[i];
    const prevState = state;
    state = automaton[state][char] || 0;

    steps.push({
      textIndex: i,
      patternIndex: state - 1,
      state: state,
      prevState: prevState,
      comparing: true,
      message: `Reading '${char}' at position ${i}: state ${prevState} → ${state}`,
    });

    if (state === m) {
      matches.push(i - m + 1);
      steps.push({
        textIndex: i - m + 1,
        found: true,
        state: state,
        message: `Pattern found at position ${i - m + 1}!`,
      });
    }
  }

  return { steps, matches };
}

function PatternMatchingSimulator() {
  const {
    text,
    pattern,
    algorithm,
    isPlaying,
    currentStep,
    steps,
    matches,
    speed,
    setText,
    setPattern,
    setAlgorithm,
    setIsPlaying,
    setCurrentStep,
    setSteps,
    setMatches,
    setSpeed,
    reset,
  } = useSimulatorStore();

  const [inputText, setInputText] = useState(text);
  const [inputPattern, setInputPattern] = useState(pattern);

  useEffect(() => {
    let result;
    if (algorithm === "brute-force") {
      result = bruteForceSteps(text, pattern);
    } else if (algorithm === "rabin-karp") {
      result = rabinKarpSteps(text, pattern);
    } else if (algorithm === "finite-automata") {
      result = finiteAutomataSteps(text, pattern);
    }
    setSteps(result.steps);
    setMatches(result.matches);
    setCurrentStep(0);
  }, [text, pattern, algorithm]);

  useEffect(() => {
    if (!isPlaying || currentStep >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(currentStep + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length, speed]);

  const handleStart = () => {
    if (!pattern || !text) return;
    setText(inputText);
    setPattern(inputPattern);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    reset();
  };

  const handleStepForward = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const currentStepData = steps[currentStep] || {};

  const renderTextWithHighlight = () => {
    return text.split("").map((char, idx) => {
      let className =
        "inline-block rounded-md w-8 h-8 border border-primary/30 text-center leading-8";

      if (
        currentStepData.found &&
        matches.some((m) => idx >= m && idx < m + pattern.length)
      ) {
        className += " bg-green-200 border-green-500 dark:text-black";
      } else if (currentStepData.comparing) {
        const textIdx = currentStepData.textIndex;
        const patternIdx = currentStepData.patternIndex;

        if (idx === textIdx + patternIdx) {
          className += currentStepData.match
            ? " bg-yellow-200 border-yellow-500 dark:text-black"
            : " bg-red-200 border-red-500 dark:text-black";
        } else if (idx >= textIdx && idx < textIdx + pattern.length) {
          className += " bg-blue-100 border-blue-300 dark:text-black";
        }
      }

      return (
        <span key={idx} className={className}>
          {char}
        </span>
      );
    });
  };

  const renderPattern = () => {
    return pattern.split("").map((char, idx) => {
      let className =
        "inline-block rounded-md w-8 h-8 border border-primary/30 text-center leading-8";

      if (currentStepData.comparing && idx === currentStepData.patternIndex) {
        className += currentStepData.match
          ? " bg-yellow-200 border-yellow-500 dark:text-black"
          : " bg-red-200 border-red-500 dark:text-black";
      }

      return (
        <span key={idx} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Pattern Matching Simulator
          </h1>
          <p className="text-muted-foreground">
            Visualize and understand string matching algorithms
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Set up your text and pattern to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.toUpperCase())}
                placeholder="Enter text to search in"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="pattern">Pattern</Label>
              <Input
                id="pattern"
                value={inputPattern}
                onChange={(e) => setInputPattern(e.target.value.toUpperCase())}
                placeholder="Enter pattern to search for"
                className="font-mono"
              />
            </div>
            <div>
              <Label>Algorithm</Label>
              <Tabs value={algorithm} onValueChange={setAlgorithm}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="brute-force">Brute Force</TabsTrigger>
                  <TabsTrigger value="rabin-karp">Rabin-Karp</TabsTrigger>
                  <TabsTrigger value="finite-automata">
                    Finite Automata
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="speed">Speed:</Label>
              <Slider
                value={[speed]}
                max={2000}
                min={100}
                step={100}
                onValueChange={(val) => setSpeed(val[0])}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-16">
                {speed}ms
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="lg" onClick={handleStart} className="flex-1">
                <ChevronRight/>
                Start
              </Button>
              <Button size="lg" onClick={handlePlayPause} variant="outline">
                {isPlaying ? (
                  <Pause />
                ) : (
                  <Play />
                )}
              </Button>
              <Button
                size="lg"
                onClick={handleStepForward}
                variant="outline"
                disabled={currentStep >= steps.length}
              >
                <SkipForward />
              </Button>
              <Button size="lg" onClick={handleReset} variant="outline">
                <RotateCcw />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length} • Matches found:{" "}
              {matches.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Text:</Label>
              <div className="flex flex-wrap gap-1">{renderTextWithHighlight()}</div>
            </div>
            <div>
              <Label className="mb-2 block">Pattern:</Label>
              <div className="flex flex-wrap gap-1">{renderPattern()}</div>
            </div>
            {currentStepData.message && (
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-sm font-mono text-muted-foreground">
                  {currentStepData.message}
                </p>
                {algorithm === "rabin-karp" &&
                  currentStepData.textHash !== undefined && (
                    <div className="mt-2 text-xs">
                      <p>
                        Text Hash: {currentStepData.textHash} | Pattern Hash:{" "}
                        {currentStepData.patternHash}
                      </p>
                    </div>
                  )}
                {algorithm === "finite-automata" &&
                  currentStepData.state !== undefined && (
                    <div className="mt-2 text-xs ">
                      <p>Current State: {currentStepData.state}</p>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Algorithm Information</CardTitle>
          </CardHeader>
          <CardContent>
            {algorithm === "brute-force" && (
              <div className="space-y-2">
                <h3 className="font-semibold">Brute Force Algorithm</h3>
                <p className="text-sm text-muted-foreground">
                  The simplest pattern matching algorithm. It checks for a match
                  at every position in the text by comparing the pattern
                  character by character.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Time Complexity:</strong> O(n×m) where n is text
                  length and m is pattern length
                </p>
              </div>
            )}
            {algorithm === "rabin-karp" && (
              <div className="space-y-2">
                <h3 className="font-semibold">Rabin-Karp Algorithm</h3>
                <p className="text-sm text-muted-foreground">
                  Uses hashing to find patterns. It computes hash values for the
                  pattern and text windows, then compares hashes. When hashes
                  match, it verifies character by character.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Time Complexity:</strong> O(n+m) average case, O(n×m)
                  worst case
                </p>
              </div>
            )}
            {algorithm === "finite-automata" && (
              <div className="space-y-2">
                <h3 className="font-semibold">Finite Automata Algorithm</h3>
                <p className="text-sm text-muted-foreground">
                  Builds a state machine (automaton) from the pattern. Each
                  character in the text causes a transition between states. When
                  the final state is reached, a match is found.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Time Complexity:</strong> O(n) after O(m³×|Σ|)
                  preprocessing (|Σ| is alphabet size)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PatternMatchingSimulator;
