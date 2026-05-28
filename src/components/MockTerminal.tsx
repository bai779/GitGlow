import React, { useState, useRef, useEffect } from "react";

interface TerminalLine {
  text: string;
  type: "input" | "output" | "error" | "info" | "success";
}

interface MockTerminalProps {
  onCommand: (commandStr: string) => { output: string; error?: string; success: boolean };
  onUndo?: () => void;
  onRedo?: () => void;
  currentLevelTitle?: string;
}

const COMMAND_SUGGESTIONS = [
  "git commit -m '",
  "git checkout ",
  "git switch ",
  "git checkout -b ",
  "git branch ",
  "git branch -d ",
  "git merge ",
  "git rebase ",
  "git cherry-pick ",
  "git reset --hard ",
  "git reset --soft ",
  "git tag ",
  "git log",
  "git status",
  "git undo",
  "git redo",
  "clear",
  "help"
];

export const MockTerminal: React.FC<MockTerminalProps> = ({
  onCommand,
  onUndo,
  onRedo,
  currentLevelTitle
}) => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: "Welcome to GitGlow Terminal v1.0.0", type: "info" },
    { text: "Type 'help' to see available commands. Use 'git undo' if you make a mistake.", type: "info" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [suggestion, setSuggestion] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click anywhere in terminal
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Autocomplete suggestion checker
  useEffect(() => {
    if (!inputVal) {
      setSuggestion("");
      return;
    }
    const match = COMMAND_SUGGESTIONS.find(s => s.startsWith(inputVal));
    if (match && match !== inputVal) {
      setSuggestion(match);
    } else {
      setSuggestion("");
    }
  }, [inputVal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Log input command
    const newHistory = [...history, { text: `$ ${cmd}`, type: "input" as const }];

    // Handle special terminal-only commands
    if (cmd === "clear") {
      setHistory([]);
      setInputVal("");
      setHistoryPointer(-1);
      return;
    }

    if (cmd === "help") {
      setHistory([
        ...newHistory,
        {
          text: `GitGlow Available Commands:
  git commit -m "msg"   Create a new commit
  git branch <name>       Create a branch
  git branch -d <name>    Delete a branch
  git checkout <ref>      Checkout a branch, tag, or commit
  git checkout -b <name>  Create and switch to a branch
  git merge <branch>      Merge branch into current HEAD
  git rebase <branch>     Rebase current branch onto target
  git cherry-pick <cid>   Copy commits onto active HEAD
  git reset --hard <cid>  Move branch pointer to target commit
  git tag <tag-name>      Create a tag
  git log                 Show commit log history
  git status              Show working tree status
  git undo / git redo     Undo/redo last command
  clear                   Clear terminal`,
          type: "info"
        }
      ]);
      setCmdHistory([...cmdHistory, cmd]);
      setInputVal("");
      setHistoryPointer(-1);
      return;
    }

    if (cmd === "git undo") {
      if (onUndo) {
        onUndo();
        setHistory([...newHistory, { text: "Undo successful.", type: "success" }]);
      } else {
        setHistory([...newHistory, { text: "Undo not supported in this context.", type: "error" }]);
      }
      setCmdHistory([...cmdHistory, cmd]);
      setInputVal("");
      setHistoryPointer(-1);
      return;
    }

    if (cmd === "git redo") {
      if (onRedo) {
        onRedo();
        setHistory([...newHistory, { text: "Redo successful.", type: "success" }]);
      } else {
        setHistory([...newHistory, { text: "Redo not supported in this context.", type: "error" }]);
      }
      setCmdHistory([...cmdHistory, cmd]);
      setInputVal("");
      setHistoryPointer(-1);
      return;
    }

    // Call engine command
    const result = onCommand(cmd);

    let outputLines: TerminalLine[] = [];
    if (result.success) {
      outputLines.push({ text: result.output || "Success.", type: "output" });
    } else {
      outputLines.push({ text: result.error || "Command error.", type: "error" });
    }

    setHistory([...newHistory, ...outputLines]);
    setCmdHistory([...cmdHistory, cmd]);
    setInputVal("");
    setHistoryPointer(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow Up - command history previous
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextPointer = historyPointer === -1 ? cmdHistory.length - 1 : Math.max(0, historyPointer - 1);
      setHistoryPointer(nextPointer);
      setInputVal(cmdHistory[nextPointer]);
    }

    // Arrow Down - command history next
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer === -1) return;
      const nextPointer = historyPointer + 1;
      if (nextPointer >= cmdHistory.length) {
        setHistoryPointer(-1);
        setInputVal("");
      } else {
        setHistoryPointer(nextPointer);
        setInputVal(cmdHistory[nextPointer]);
      }
    }

    // Tab - autocomplete suggestion
    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestion) {
        setInputVal(suggestion);
        setSuggestion("");
      }
    }
  };

  return (
    <div className="terminal-panel" onClick={handleTerminalClick}>
      {/* Terminal Title Bar */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <div className="terminal-title">
          bash - GitGlow CLI {currentLevelTitle ? `[${currentLevelTitle}]` : "(Sandbox)"}
        </div>
      </div>

      {/* Terminal Output Body */}
      <div className="terminal-body" ref={scrollRef}>
        <div className="terminal-lines">
          {history.map((line, idx) => (
            <div key={idx} className={`terminal-line type-${line.type}`}>
              {line.text}
            </div>
          ))}
        </div>

        {/* Input Line with Autocomplete Suggestion Ghost */}
        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span className="terminal-prompt">bai779@GitGlow:~$</span>
          <div className="terminal-input-wrapper">
            {/* suggestion ghost */}
            {suggestion && (
              <span className="terminal-suggestion-ghost">
                {suggestion}
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="terminal-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              maxLength={80}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
