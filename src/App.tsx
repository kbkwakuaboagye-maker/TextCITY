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
  ArrowRightLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { polishText } from './services/geminiService';
import { cn } from './lib/utils';

type StyleOption = 'professional' | 'creative' | 'concise';

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('professional');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'result'>('split');
  const resultRef = useRef<HTMLDivElement>(null);

  const handlePolish = async () => {
    if (!input.trim() || isPolishing) return;
    
    setIsPolishing(true);
    try {
      const result = await polishText(input, selectedStyle);
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
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Type className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight">TextCITY</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-black/5 p-1 rounded-full">
              {(['professional', 'creative', 'concise'] as StyleOption[]).map((style) => (
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your rough draft here... We'll fix the grammar, punctuation, and style automatically."
            className="flex-1 w-full p-8 rounded-3xl bg-white border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none text-lg leading-relaxed placeholder:text-black/10 min-h-[400px]"
          />
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
