import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flashcard } from '../../types';
import {
  BrainCircuit,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Plus,
  Flame,
  ArrowRight
} from 'lucide-react';

export const TargetedRevisionPage: React.FC = () => {
  const { revisionDeck, rateFlashcard, addFlashcards, navigate } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeCard = revisionDeck[currentIndex] as Flashcard | undefined;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % revisionDeck.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + revisionDeck.length) % revisionDeck.length);
  };

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeCard) return;
    rateFlashcard(activeCard.id, rating);
    handleNext();
  };

  const handleGenerateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/tutor/targeted-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: 'Video Editing with DaVinci Resolve',
          topic: customTopic.trim(),
          weakAreas: [customTopic.trim()]
        })
      });
      const data = await res.json();
      if (data.flashcards && Array.isArray(data.flashcards)) {
        const generated: Flashcard[] = data.flashcards.map((c: any, idx: number) => ({
          id: `fc-gen-${Date.now()}-${idx}`,
          topic: customTopic,
          question: c.question,
          answer: c.answer,
          mnemonic: c.mnemonic || 'Practice active recall daily.',
          difficulty: c.difficulty || 'Medium',
          masteryScore: 40
        }));
        addFlashcards(generated);
        setCustomTopic('');
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to generate revision deck:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEBDA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F14C2F]">
              <BrainCircuit className="w-4 h-4" /> Spaced Repetition Engine
            </div>
            <h1 className="text-3xl font-extrabold text-[#393636] mt-1">
              DaVinci Resolve Targeted Revision
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Reinforce keyboard shortcuts, trim workflows, color wheels, and audio EQ where your evaluations identified gaps.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('classroom')}
              className="px-4 py-2 bg-white text-[#393636] hover:bg-gray-50 border border-[#393636]/15 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Resume Lesson <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Generate Custom Deck Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#393636]/10 shadow-sm space-y-3">
          <form onSubmit={handleGenerateRevision} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-[#393636] mb-1">
                Generate Instant AI Flashcards for Any DaVinci Resolve Topic:
              </label>
              <input
                type="text"
                placeholder="e.g. Blade tool shortcuts, Ripple delete, Lift vs Extract, Primary Color Wheels, Fairlight Voice Isolation..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating || !customTopic.trim()}
              className="w-full sm:w-auto mt-auto px-5 py-2.5 bg-[#F14C2F] hover:bg-[#d63b20] disabled:bg-gray-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Synthesizing Cards...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Generate Revision Cards
                </>
              )}
            </button>
          </form>

          {/* Quick topic pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#393636]">
            <span className="text-[#393636]/60">Quick Topics:</span>
            <button
              type="button"
              onClick={() => setCustomTopic('Blade tool vs Selection tool shortcuts')}
              className="px-2.5 py-1 bg-[#EFEBDA] rounded-lg hover:bg-[#e4dfcb] transition-colors"
            >
              Blade tool (B vs A)
            </button>
            <button
              type="button"
              onClick={() => setCustomTopic('Ripple Delete vs Backspace gap handling')}
              className="px-2.5 py-1 bg-[#EFEBDA] rounded-lg hover:bg-[#e4dfcb] transition-colors"
            >
              Ripple Delete (Shift+Del)
            </button>
            <button
              type="button"
              onClick={() => setCustomTopic('Color Wheels: Lift, Gamma, Gain and Offset')}
              className="px-2.5 py-1 bg-[#EFEBDA] rounded-lg hover:bg-[#e4dfcb] transition-colors"
            >
              Color Wheels (Lift/Gamma/Gain)
            </button>
            <button
              type="button"
              onClick={() => setCustomTopic('Fairlight Audio EQ and Voice Isolation')}
              className="px-2.5 py-1 bg-[#EFEBDA] rounded-lg hover:bg-[#e4dfcb] transition-colors"
            >
              Fairlight Voice Isolation
            </button>
          </div>
        </div>

        {/* Flashcard Viewer */}
        {revisionDeck.length > 0 && activeCard ? (
          <div className="space-y-6">
            {/* Counter and Mastery Header */}
            <div className="flex items-center justify-between text-xs font-semibold text-[#393636]">
              <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                Card {currentIndex + 1} of {revisionDeck.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Topic:</span>
                <span className="bg-[#F14C2F]/10 text-[#F14C2F] px-2.5 py-0.5 rounded-md font-bold">
                  {activeCard.topic}
                </span>
                <span className="text-gray-500">Mastery:</span>
                <span className="font-extrabold text-[#393636]">
                  {activeCard.masteryScore ?? 50}%
                </span>
              </div>
            </div>

            {/* The 3D Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[300px] sm:min-h-[340px] bg-white rounded-3xl p-8 sm:p-12 border-2 border-[#393636]/15 shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between relative group select-none"
            >
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-bold tracking-wider uppercase text-[#F14C2F]">
                  {isFlipped ? 'Answer & Mental Model' : 'Question (Active Recall)'}
                </span>
                <span className="flex items-center gap-1 group-hover:text-[#393636] transition-colors">
                  <RotateCw className="w-3.5 h-3.5" /> Click to {isFlipped ? 'see question' : 'flip answer'}
                </span>
              </div>

              {/* Main Prompt/Answer */}
              <div className="my-auto py-6">
                {!isFlipped ? (
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#393636] leading-relaxed">
                      {activeCard.question}
                    </h3>
                    <p className="text-xs text-gray-400 italic">
                      Formulate your reasoning before flipping the card.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[#393636] text-sm sm:text-base leading-relaxed font-medium">
                      {activeCard.answer}
                    </div>
                    {activeCard.mnemonic && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Key Takeaway:</strong> {activeCard.mnemonic}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
                <span>Difficulty: {activeCard.difficulty}</span>
                <span className="text-[11px] text-[#F14C2F] font-semibold">TUTeach Evidence Engine</span>
              </div>
            </div>

            {/* Rating Controls (Shown after flipping or always available) */}
            <div className="space-y-3">
              <p className="text-center text-xs font-semibold text-gray-500">
                How well did you recall this concept?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleRate('again')}
                  className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs rounded-xl shadow-2xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Again</span>
                  <span className="text-[10px] font-normal text-red-700">&lt; 1 min</span>
                </button>
                <button
                  onClick={() => handleRate('hard')}
                  className="py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl shadow-2xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Hard</span>
                  <span className="text-[10px] font-normal text-amber-700">6 mins</span>
                </button>
                <button
                  onClick={() => handleRate('good')}
                  className="py-3 px-4 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs rounded-xl shadow-2xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Good</span>
                  <span className="text-[10px] font-normal text-blue-700">1 day</span>
                </button>
                <button
                  onClick={() => handleRate('easy')}
                  className="py-3 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl shadow-2xs transition-colors flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span>Easy</span>
                  <span className="text-[10px] font-normal text-emerald-700">4 days</span>
                </button>
              </div>
            </div>

            {/* Previous / Next Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-bold text-[#393636] hover:bg-white rounded-xl border border-gray-300 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Card
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 text-xs font-bold text-[#393636] hover:bg-white rounded-xl border border-gray-300 flex items-center gap-1 transition-colors"
              >
                Next Card <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl p-8 border border-gray-200">
            <BrainCircuit className="w-12 h-12 text-[#F14C2F] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#393636]">Your Revision Deck is Ready</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              When you submit assignments in the classroom, TUTeach automatically generates targeted revision cards for your weak areas!
            </p>
            <button
              onClick={() => navigate('classroom')}
              className="px-6 py-2.5 bg-[#F14C2F] text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Start Course in Classroom
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
