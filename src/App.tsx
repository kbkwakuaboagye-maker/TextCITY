/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Download, 
  Trash2, 
  Check, 
  ChevronRight, 
  Type, 
  Zap, 
  PenTool,
  Loader2,
  ArrowRightLeft,
  History,
  X,
  Clock,
  Save
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { polishText } from './services/geminiService';
import { cn } from './lib/utils';

type StyleOption = 'professional' | 'creative' | 'concise' | 'custom';

interface HistoryItem {
  id: string;
  title: string;
  input: string;
  output: string;
  style: StyleOption;
  customInstruction?: string;
  timestamp: number;
}

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('professional');
  const [customInstruction, setCustomInstruction] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'result'>('split');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('textcity_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('textcity_history', JSON.stringify(history));
  }, [history]);

  const handlePolish = async () => {
    if (!input.trim() || isPolishing) return;
    if (selectedStyle === 'custom' && !customInstruction.trim()) {
      alert("Please provide custom instructions for the AI.");
      return;
    }
    
    setIsPolishing(true);
    try {
      const result = await polishText(input, selectedStyle, customInstruction);
      setOutput(result);
      if (viewMode === 'split' && window.innerWidth < 768) {
        setViewMode('result');
      }
    } catch (error) {
      console.error("Polishing failed:", error);
      alert("Something went wrong while polishing your text. Please check your connection and try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  const saveToHistory = () => {
    if (!output) return;
    
    const title = input.slice(0, 40).trim() + (input.length > 40 ? '...' : '');
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      title: title || 'Untitled Document',
      input,
      output,
      style: selectedStyle,
      customInstruction: selectedStyle === 'custom' ? customInstruction : undefined,
      timestamp: Date.now(),
    };
    
    setHistory(prev => [newItem, ...prev]);
    alert("Saved to history!");
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input);
    setOutput(item.output);
    setSelectedStyle(item.style);
    if (item.customInstruction) setCustomInstruction(item.customInstruction);
    setIsHistoryOpen(false);
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this item from history?")) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([output], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "polished-document.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to clear everything?")) {
      setInput('');
      setOutput('');
      setCustomInstruction('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDFCFB]">
      {/* History Sidebar Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-black/5 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-black/40" />
                  <h2 className="font-serif font-bold text-lg">History</h2>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                    <Clock className="w-8 h-8 mb-2" />
                    <p className="text-xs font-mono uppercase tracking-widest">No history yet</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-4 rounded-2xl border border-black/5 hover:border-black/20 hover:bg-black/[0.02] transition-all group relative"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-black/20 uppercase tracking-tighter">
                          {new Date(item.timestamp).toLocaleDateString()} &bull; {item.style}
                        </span>
                        <h3 className="text-sm font-medium line-clamp-1 pr-6">{item.title}</h3>
                      </div>
                      <button
                        onClick={(e) => deleteFromHistory(e, item.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/0 group-hover:text-black/20 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors relative group"
              title="View History"
            >
              <History className="w-5 h-5 text-black/60" />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full border-2 border-white" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Type className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif font-bold tracking-tight">TextCITY</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-black/5 p-1 rounded-full">
              {(['professional', 'creative', 'concise', 'custom'] as StyleOption[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize",
                    selectedStyle === style 
                      ? "bg-white text-black shadow-sm" 
                      : "text-black/40 hover:text-black/60"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePolish}
                disabled={!input.trim() || isPolishing}
                className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
              >
                {isPolishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isPolishing ? 'Polishing...' : 'Polish'}
              </button>

              {output && (
                <button
                  onClick={saveToHistory}
                  className="bg-white border border-black/10 text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-black/5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className={cn(
          "flex flex-col gap-4 transition-all duration-500",
          viewMode === 'result' ? 'hidden lg:flex' : 'flex'
        )}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-widest text-black/40">Draft</label>
            <button 
              onClick={clearAll}
              className="p-2 text-black/20 hover:text-red-500 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your rough draft here... We'll fix the grammar, punctuation, and style automatically."
              className="flex-1 w-full p-8 rounded-3xl bg-white border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none text-lg leading-relaxed placeholder:text-black/10 min-h-[300px]"
            />
            
            <AnimatePresence>
              {selectedStyle === 'custom' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-black/5 rounded-2xl flex flex-col gap-2 border border-black/5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-black/40 font-bold">Custom AI Instructions</label>
                    <input 
                      type="text"
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      placeholder="e.g., 'Make it sound like a CEO', 'Add a touch of humor', 'Fix only the punctuation'"
                      className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-black/20"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Output Section */}
        <section className={cn(
          "flex flex-col gap-4 transition-all duration-500",
          viewMode === 'split' && !output ? 'hidden lg:flex opacity-30 pointer-events-none' : 'flex'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-xs font-mono uppercase tracking-widest text-black/40">Polished</label>
              <div className="flex lg:hidden bg-black/5 p-1 rounded-full">
                <button 
                  onClick={() => setViewMode('split')}
                  className={cn("p-1 rounded-full", viewMode === 'split' ? 'bg-white shadow-sm' : '')}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {output && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={saveToHistory}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 text-black/60 transition-all text-xs font-medium"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to History</span>
                </button>
                <button 
                  onClick={handleCopy}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors relative"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleDownload}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                  title="Download as .txt"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div 
            ref={resultRef}
            className="flex-1 w-full p-8 rounded-3xl bg-black text-white shadow-2xl overflow-auto min-h-[400px] relative group"
          >
            <AnimatePresence mode="wait">
              {isPolishing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm z-10"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                  <p className="text-sm font-mono text-white/40 animate-pulse uppercase tracking-tighter">Refining your words...</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {output ? (
              <div className="markdown-body prose prose-invert max-w-none">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-6 p-12">
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                  <PenTool className="w-6 h-6 text-white/20" />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic mb-2">Ready for perfection?</h3>
                  <p className="text-sm text-white/40 max-w-xs mx-auto">Click the polish button to transform your rough draft into a masterpiece.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer / Features */}
      <footer className="max-w-7xl mx-auto w-full p-6 border-t border-black/5 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature 
            icon={<Zap className="w-4 h-4" />}
            title="Instant Correction"
            description="Grammar, spelling, and punctuation fixed in seconds."
          />
          <Feature 
            icon={<Sparkles className="w-4 h-4" />}
            title="Style Elevation"
            description="Elevate your tone from casual to professional or creative."
          />
          <Feature 
            icon={<Check className="w-4 h-4" />}
            title="Meaning Preserved"
            description="Your intent stays the same, only the delivery is perfected."
          />
        </div>
        <div className="mt-12 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-black/20">
          TextCITY &copy; 2026 &mdash; The Best Writing Ever
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-black/40 mb-1">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">{title}</span>
      </div>
      <p className="text-sm text-black/60 leading-relaxed">{description}</p>
    </div>
  );
}
