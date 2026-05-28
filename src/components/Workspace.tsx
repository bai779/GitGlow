import React, { useState, useEffect, useRef } from "react";
import { GitEngine } from "../logic/gitEngine";
import type { GitState } from "../logic/gitEngine";
import { GIT_LEVELS } from "../data/levels";
import { Sidebar } from "./Sidebar";
import { GitGraph } from "./GitGraph";
import { MockTerminal } from "./MockTerminal";
import { RefreshCw, SkipForward, Award } from "lucide-react";
import confetti from "canvas-confetti";

export const Workspace: React.FC = () => {
  // Load completed levels from localStorage
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
    // 3 burst triggers
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
    // We pass this through, and inside MockTerminal we will listen for inputVal changes.
    // However, to make it clean, we can focus and insert.
    // For now, we can write it to window or pass an event.
    // A simple custom event or state variable that MockTerminal consumes is easiest.
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

  return (
    <div className="workspace-container">
      {/* 1. Left Sidebar */}
      <Sidebar
        levels={GIT_LEVELS}
        currentLevelId={currentLevelId}
        completedLevelIds={completedLevelIds}
        onSelectLevel={handleSelectLevel}
        onCheatClick={handleCheatClick}
      />

      {/* 2. Main Content Canvas */}
      <div className="main-content">
        {/* Top Control Bar */}
        <div className="control-bar">
          <div className="control-bar-left">
            <h3>{activeLevel ? `Challenge Mode: Level ${activeLevel.id}` : "Sandbox Playground Mode"}</h3>
          </div>
          <div className="control-bar-right">
            <button className="control-btn" title="Reset current state" onClick={handleReset}>
              <RefreshCw size={16} />
              <span>Reset</span>
            </button>
            {activeLevel && (
              <button
                className="control-btn skip-btn"
                title="Skip this level"
                onClick={() => handleNextLevel()}
              >
                <SkipForward size={16} />
                <span>Skip</span>
              </button>
            )}
          </div>
        </div>

        {/* Level instructions (if active) */}
        {activeLevel && (
          <div className="instructions-card">
            <div className="instructions-header">
              <Award className="instructions-icon" size={20} />
              <h4>{activeLevel.title}</h4>
              <span className={`level-difficulty-pill diff-${activeLevel.difficulty.toLowerCase()}`}>
                {activeLevel.difficulty}
              </span>
            </div>
            <div className="instructions-body">
              <p className="description-text">{activeLevel.description}</p>
              <div className="goal-box">
                <strong>🎯 Objective:</strong>
                <p>{activeLevel.goal}</p>
              </div>
              {activeLevel.hint && (
                <details className="hint-details">
                  <summary>💡 Need a hint?</summary>
                  <p className="hint-text">{activeLevel.hint}</p>
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
              currentLevelTitle={activeLevel ? activeLevel.title : undefined}
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
            <h2>Challenge Solved!</h2>
            <p>Excellent job! You successfully resolved the git state and matched the objectives.</p>
            <div className="modal-actions">
              <button className="modal-btn primary-btn" onClick={handleNextLevel}>
                {currentLevelId !== null && currentLevelId < GIT_LEVELS.length
                  ? "Next Challenge"
                  : "Go to Sandbox"}
              </button>
              <button className="modal-btn secondary-btn" onClick={() => setShowSuccessModal(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Workspace;
