import React, { useState, useEffect, useRef } from "react";
import { GitEngine } from "../logic/gitEngine";
import type { GitState } from "../logic/gitEngine";
import { GIT_LEVELS } from "../data/levels";
import { Sidebar } from "./Sidebar";
import { GitGraph } from "./GitGraph";
import { MockTerminal } from "./MockTerminal";
import { RefreshCw, SkipForward, Award, RotateCcw, RotateCw, Globe } from "lucide-react";
import type { Language } from "../data/translations";
import { UI_TRANSLATIONS } from "../data/translations";
import confetti from "canvas-confetti";

export const Workspace: React.FC = () => {
  // 1. Language state (defaults to Chinese "zh")
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("gitglow_language");
    return (saved === "en" || saved === "zh") ? saved : "zh";
  });

  const toggleLanguage = () => {
    const nextLang = lang === "zh" ? "en" : "zh";
    setLang(nextLang);
    localStorage.setItem("gitglow_language", nextLang);
  };

  const t = UI_TRANSLATIONS[lang];

  // 2. Load completed levels from localStorage
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("gitglow_completed_levels");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLevelId, setCurrentLevelId] = useState<number | null>(1); // Default to level 1
  const [gitState, setGitState] = useState<GitState>(() => {
    const firstLevel = GIT_LEVELS[0];
    return JSON.parse(JSON.stringify(firstLevel.initialState));
  });
  
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [terminalInsertVal, setTerminalInsertVal] = useState<string | null>(null);

  // Initialize engine ref to persist engine instance
  const engineRef = useRef<GitEngine>(new GitEngine(gitState));

  // Find active level object
  const activeLevel = GIT_LEVELS.find(l => l.id === currentLevelId) || null;

  // Track state sync
  const syncStateWithEngine = () => {
    setGitState(engineRef.current.getState());
  };

  // Reset current playground/level
  const handleReset = () => {
    if (activeLevel) {
      engineRef.current.setState(activeLevel.initialState);
    } else {
      // Sandbox mode reset
      engineRef.current = new GitEngine();
    }
    setIsLevelSolved(false);
    setShowSuccessModal(false);
    syncStateWithEngine();
  };

  // Triggered when switching levels or sandbox
  const handleSelectLevel = (levelId: number | null) => {
    setCurrentLevelId(levelId);
    setIsLevelSolved(false);
    setShowSuccessModal(false);

    if (levelId === null) {
      // Sandbox
      engineRef.current = new GitEngine();
    } else {
      const level = GIT_LEVELS.find(l => l.id === levelId);
      if (level) {
        engineRef.current.setState(level.initialState);
      }
    }
    syncStateWithEngine();
  };

  // Handle commands typed in mock terminal
  const handleTerminalCommand = (commandStr: string) => {
    const result = engineRef.current.execute(commandStr);
    if (result.success && result.stateChanged) {
      syncStateWithEngine();
    }
    return result;
  };

  // Handle undo/redo
  const handleUndo = () => {
    if (engineRef.current.undo()) {
      syncStateWithEngine();
    }
  };

  const handleRedo = () => {
    if (engineRef.current.redo()) {
      syncStateWithEngine();
    }
  };

  // Validate state on every state change when in level mode
  useEffect(() => {
    if (!activeLevel || isLevelSolved) return;

    const isSolved = activeLevel.validate(gitState);
    if (isSolved) {
      setIsLevelSolved(true);
      
      // Update completed levels in state & local storage
      const newCompleted = [...completedLevelIds];
      if (!newCompleted.includes(activeLevel.id)) {
        newCompleted.push(activeLevel.id);
        setCompletedLevelIds(newCompleted);
        localStorage.setItem("gitglow_completed_levels", JSON.stringify(newCompleted));
      }

      // Celebratory Confetti!
      triggerConfetti();

      // Show success modal after short delay
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 1000);
    }
  }, [gitState, activeLevel, isLevelSolved, completedLevelIds]);

  const triggerConfetti = () => {
    const duration = 1.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#00f2fe", "#ff0844", "#a18cd1"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#00f2fe", "#ff0844", "#a18cd1"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleNextLevel = () => {
    setShowSuccessModal(false);
    if (currentLevelId !== null) {
      const nextId = currentLevelId + 1;
      const nextLevelExists = GIT_LEVELS.some(l => l.id === nextId);
      if (nextLevelExists) {
        handleSelectLevel(nextId);
      } else {
        // All levels completed! Switch to sandbox
        handleSelectLevel(null);
      }
    }
  };

  // Handle clicking on a command in the Cheat Sheet
  const handleCheatClick = (cmdText: string) => {
    setTerminalInsertVal(cmdText);
  };

  // Synchronize cheat sheet command inserts
  useEffect(() => {
    if (terminalInsertVal) {
      const terminalInput = document.querySelector(".terminal-input") as HTMLInputElement;
      if (terminalInput) {
        terminalInput.value = terminalInsertVal;
        // Trigger React onChange manually
        const event = new Event("input", { bubbles: true });
        terminalInput.dispatchEvent(event);
        terminalInput.focus();
      }
      setTerminalInsertVal(null);
    }
  }, [terminalInsertVal]);

  const activeLevelTitle = activeLevel ? (lang === "zh" ? activeLevel.titleZh : activeLevel.titleEn) : "";
  const activeLevelDesc = activeLevel ? (lang === "zh" ? activeLevel.descriptionZh : activeLevel.descriptionEn) : "";
  const activeLevelGoal = activeLevel ? (lang === "zh" ? activeLevel.goalZh : activeLevel.goalEn) : "";
  const activeLevelHint = activeLevel ? (lang === "zh" ? activeLevel.hintZh : activeLevel.hintEn) : "";

  return (
    <div className="workspace-container">
      {/* 1. Left Sidebar */}
      <Sidebar
        levels={GIT_LEVELS}
        currentLevelId={currentLevelId}
        completedLevelIds={completedLevelIds}
        onSelectLevel={handleSelectLevel}
        onCheatClick={handleCheatClick}
        lang={lang}
      />

      {/* 2. Main Content Canvas */}
      <div className="main-content">
        {/* Top Control Bar */}
        <div className="control-bar">
          <div className="control-bar-left">
            <h3>
              {activeLevel 
                ? `${t.challengeModeLabel} ${activeLevel.id} ${lang === 'zh' ? '关' : ''}` 
                : t.sandboxModeLabel}
            </h3>
          </div>
          <div className="control-bar-right">
            {/* Language Switcher */}
            <button className="control-btn lang-btn" title="Switch Language / 切换语言" onClick={toggleLanguage}>
              <Globe size={15} />
              <span>{lang === "zh" ? "EN" : "中文"}</span>
            </button>

            {/* Undo / Redo buttons */}
            <button className="control-btn" title={t.undoBtn} onClick={handleUndo}>
              <RotateCcw size={15} />
              <span>{t.undoBtn}</span>
            </button>
            <button className="control-btn" title={t.redoBtn} onClick={handleRedo}>
              <RotateCw size={15} />
              <span>{t.redoBtn}</span>
            </button>

            {/* Reset button */}
            <button className="control-btn" title={t.resetBtn} onClick={handleReset}>
              <RefreshCw size={15} />
              <span>{t.resetBtn}</span>
            </button>

            {/* Skip button */}
            {activeLevel && (
              <button
                className="control-btn skip-btn"
                title={t.skipBtn}
                onClick={handleNextLevel}
              >
                <SkipForward size={15} />
                <span>{t.skipBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Level instructions (if active) */}
        {activeLevel && (
          <div className="instructions-card">
            <div className="instructions-header">
              <Award className="instructions-icon" size={20} />
              <h4>{activeLevelTitle}</h4>
              <span className={`level-difficulty-pill diff-${activeLevel.difficulty.toLowerCase()}`}>
                {activeLevel.difficulty}
              </span>
            </div>
            <div className="instructions-body">
              <p className="description-text">{activeLevelDesc}</p>
              <div className="goal-box">
                <strong>{t.objectiveLabel}</strong>
                <p>{activeLevelGoal}</p>
              </div>
              {activeLevelHint && (
                <details className="hint-details">
                  <summary>{t.hintSummary}</summary>
                  <p className="hint-text">{activeLevelHint}</p>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Layout Split: Graph on top, Terminal on bottom */}
        <div className="workspace-split">
          <div className="visualizer-section">
            <GitGraph state={gitState} />
          </div>

          <div className="terminal-section">
            <MockTerminal
              onCommand={handleTerminalCommand}
              onUndo={handleUndo}
              onRedo={handleRedo}
              currentLevelTitle={activeLevel ? activeLevelTitle : undefined}
              lang={lang}
            />
          </div>
        </div>
      </div>

      {/* 3. Level Success Overlay Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-glow-border"></div>
            <Award className="modal-icon" size={48} />
            <h2>{t.successTitle}</h2>
            <p>{t.successDesc}</p>
            <div className="modal-actions">
              <button className="modal-btn primary-btn" onClick={handleNextLevel}>
                {currentLevelId !== null && currentLevelId < GIT_LEVELS.length
                  ? t.nextChallengeBtn
                  : t.goToSandboxBtn}
              </button>
              <button className="modal-btn secondary-btn" onClick={() => setShowSuccessModal(false)}>
                {t.dismissBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Workspace;
