import React, { useState, useEffect, useRef } from "react";
import { GitEngine } from "../logic/gitEngine";
import type { GitState } from "../logic/gitEngine";
import { GIT_LEVELS } from "../data/levels";
import { Sidebar } from "./Sidebar";
import { GitGraph } from "./GitGraph";
import { MockTerminal } from "./MockTerminal";
import { RebaseModal } from "./RebaseModal";
import { DiffPanel } from "./DiffPanel";
import { RefreshCw, SkipForward, Award, RotateCcw, RotateCw, Globe, Share2 } from "lucide-react";
import type { Language } from "../data/translations";
import { UI_TRANSLATIONS } from "../data/translations";
import confetti from "canvas-confetti";

export const Workspace: React.FC = () => {
  // 1. Language state (defaults to Chinese "zh")
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("gitglow_language");
    return (saved === "en" || saved === "zh" || saved === "ja" || saved === "es") ? saved : "zh";
  });

  const t = UI_TRANSLATIONS[lang];

  // 2. Load completed levels from localStorage
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("gitglow_completed_levels");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLevelId, setCurrentLevelId] = useState<number | null>(1); // Default to level 1
  const [gitState, setGitState] = useState<GitState>(() => {
    // 1. Check URL for custom_level
    const params = new URLSearchParams(window.location.search);
    const custom = params.get("custom_level");
    if (custom) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(custom)));
        if (decoded && decoded.commits) {
          return decoded;
        }
      } catch(e) {
        console.error("Failed to parse custom_level", e);
      }
    }
    
    // 2. Default to first level
    const firstLevel = GIT_LEVELS[0];
    return JSON.parse(JSON.stringify(firstLevel.initialState));
  });
  
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [terminalInsertVal, setTerminalInsertVal] = useState<string | null>(null);
  const [conflictText, setConflictText] = useState<string>("");
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

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
    if (result.stateChanged) {
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

  const handleShare = () => {
    try {
      const stateToShare = engineRef.current.getState();
      const b64 = btoa(encodeURIComponent(JSON.stringify(stateToShare)));
      const url = new URL(window.location.href);
      url.searchParams.set("custom_level", b64);
      navigator.clipboard.writeText(url.toString());
      alert(lang === "zh" ? "沙盒状态已复制到剪贴板！" : "Sandbox state copied to clipboard!");
    } catch(e) {
      alert("Failed to copy state.");
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

  // Synchronize conflict text when conflict starts
  useEffect(() => {
    if (gitState.conflictState?.isConflicting) {
      setConflictText(gitState.conflictState.fileContent);
    }
  }, [gitState.conflictState?.isConflicting, gitState.conflictState?.fileContent]);

  const handleResolveConflict = () => {
    const res = engineRef.current.resolveConflict(conflictText);
    if (res.stateChanged) {
      syncStateWithEngine();
    }
  };

  const handleResolveRebase = (actions: { commitId: string; action: "pick" | "squash" | "drop" }[]) => {
    const res = engineRef.current.executeInteractiveRebase(actions);
    if (res.stateChanged) {
      syncStateWithEngine();
    }
  };

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
            {/* Language Switcher Dropdown */}
            <div className="lang-selector-wrapper" style={{ display: "flex", alignItems: "center", position: "relative" }}>
              <Globe size={15} style={{ marginRight: "6px", color: "var(--text-secondary)" }} />
              <select 
                value={lang} 
                onChange={(e) => {
                  const nextLang = e.target.value as Language;
                  setLang(nextLang);
                  localStorage.setItem("gitglow_language", nextLang);
                }}
                className="control-select"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  borderRadius: "6px",
                  padding: "6px 8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="zh" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>简体中文</option>
                <option value="en" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>English</option>
                <option value="ja" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>日本語</option>
                <option value="es" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>Español</option>
              </select>
            </div>

            {/* Undo / Redo buttons */}
            <button 
              className="control-btn" 
              title={t.undoBtn} 
              onClick={handleUndo}
              disabled={!engineRef.current.canUndo()}
              style={{ 
                opacity: engineRef.current.canUndo() ? 1 : 0.4, 
                cursor: engineRef.current.canUndo() ? "pointer" : "not-allowed" 
              }}
            >
              <RotateCcw size={15} />
              <span>{t.undoBtn}</span>
            </button>
            <button 
              className="control-btn" 
              title={t.redoBtn} 
              onClick={handleRedo}
              disabled={!engineRef.current.canRedo()}
              style={{ 
                opacity: engineRef.current.canRedo() ? 1 : 0.4, 
                cursor: engineRef.current.canRedo() ? "pointer" : "not-allowed" 
              }}
            >
              <RotateCw size={15} />
              <span>{t.redoBtn}</span>
            </button>

            {/* Reset button */}
            <button className="control-btn" title={t.resetBtn} onClick={handleReset}>
              <RefreshCw size={15} />
              <span>{t.resetBtn}</span>
            </button>
            
            {/* Share button */}
            <button className="control-btn" title={lang === "zh" ? "分享状态" : "Share State"} onClick={handleShare}>
              <Share2 size={15} />
              <span>{lang === "zh" ? "分享" : "Share"}</span>
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

        <div className="workspace-split">
          <div className="visualizer-section" style={{ display: gitState.remoteState ? 'flex' : 'block' }}>
            {gitState.remoteState ? (
              <>
                <div style={{ flex: 1, minWidth: '350px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, padding: '6px 12px', background: 'rgba(0,0,0,0.5)', color: 'var(--text-secondary)', fontSize: '12px', borderBottomRightRadius: '8px', zIndex: 10 }}>Local Repository</div>
                  <GitGraph state={gitState} onNodeClick={setSelectedCommitId} />
                </div>
                <div style={{ flex: 1, minWidth: '350px', borderLeft: '1px solid var(--border-color)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, padding: '6px 12px', background: 'rgba(0,0,0,0.5)', color: 'var(--text-secondary)', fontSize: '12px', borderBottomRightRadius: '8px', zIndex: 10 }}>Remote: {gitState.remoteState.url}</div>
                  <GitGraph state={gitState.remoteState as any} onNodeClick={setSelectedCommitId} />
                </div>
              </>
            ) : (
              <GitGraph state={gitState} onNodeClick={setSelectedCommitId} />
            )}
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

      {/* 4. Conflict Resolver Modal */}
      {gitState.conflictState?.isConflicting && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: '600px', maxWidth: '90vw' }}>
            <div className="modal-glow-border" style={{ borderColor: '#ff0844' }}></div>
            <h2 style={{ color: '#ff0844', marginBottom: '8px' }}>
              {lang === 'zh' ? '代码冲突解决' : 'Merge Conflict Resolver'}
            </h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {lang === 'zh' 
                ? `合并 ${gitState.conflictState.targetBranch} 时在 index.html 中发现了冲突。请手动编辑以下内容解决冲突：`
                : `Conflict in index.html while merging ${gitState.conflictState.targetBranch}. Please edit the content below to resolve:`}
            </p>
            
            <textarea
              value={conflictText}
              onChange={(e) => setConflictText(e.target.value)}
              style={{
                width: '100%',
                height: '240px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                padding: '12px',
                marginBottom: '20px',
                resize: 'vertical'
              }}
            />

            <div className="modal-actions">
              <button 
                className="modal-btn primary-btn" 
                style={{ background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', boxShadow: '0 4px 15px rgba(255, 8, 68, 0.25)' }}
                onClick={handleResolveConflict}
              >
                {lang === 'zh' ? '标记为已解决并提交' : 'Mark as Resolved & Commit'}
              </button>
              <button 
                className="modal-btn secondary-btn" 
                onClick={handleUndo} // Aborting merge by undoing
              >
                {lang === 'zh' ? '中止合并 (撤销)' : 'Abort Merge (Undo)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Interactive Rebase Modal */}
      {gitState.rebaseState?.isActive && (
        <RebaseModal
          gitState={gitState}
          lang={lang}
          onResolve={handleResolveRebase}
          onCancel={handleUndo}
        />
      )}

      {/* 6. Diff Panel */}
      {selectedCommitId && (
        <DiffPanel 
          commitId={selectedCommitId} 
          gitState={gitState} 
          onClose={() => setSelectedCommitId(null)} 
        />
      )}
    </div>
  );
};
export default Workspace;
