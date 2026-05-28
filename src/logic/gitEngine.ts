export interface GitCommit {
  id: string; // e.g. "C0", "C1"
  message: string;
  parents: string[]; // parent commit IDs
  branch: string; // branch name where it was originally created
  timestamp: number;
  files?: Record<string, string>;
}

export interface GitState {
  commits: Record<string, GitCommit>;
  branches: Record<string, string>; // branchName -> commitId
  tags: Record<string, string>; // tagName -> commitId
  head: string; // "ref: refs/heads/branchName" OR direct commitId (detached HEAD)
  nextCommitNum: number; // For generating C1, C2, etc.
  remoteState?: {
    commits: Record<string, GitCommit>;
    branches: Record<string, string>; // e.g. "main" -> "C1" (representing origin/main)
    tags: Record<string, string>;
    head: string;
    url: string;
  };
  conflictState?: {
    isConflicting: boolean;
    targetBranch: string;
    fileContent: string;
    commandContext: "merge" | "rebase";
  };
  rebaseState?: {
    isActive: boolean;
    commitsToRebase: string[];
    targetBase: string;
    originalBranch: string;
  };
}

export interface CommandResult {
  success: boolean;
  message: string;
  output: string;
  error?: string;
  stateChanged: boolean;
}

// Initial state creator
export function createInitialState(): GitState {
  const initialCommit: GitCommit = {
    id: "C0",
    message: "Initial commit",
    parents: [],
    branch: "main",
    timestamp: Date.now(),
    files: {
      "index.html": "<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>"
    }
  };

  return {
    commits: {
      "C0": initialCommit,
    },
    branches: {
      "main": "C0",
    },
    tags: {},
    head: "ref: refs/heads/main",
    nextCommitNum: 1,
    remoteState: undefined,
  };
}

export class GitEngine {
  private state: GitState;
  private history: GitState[] = [];
  private historyIndex: number = -1;

  constructor(initialState?: GitState) {
    this.state = initialState || createInitialState();
    this.pushHistory(this.state);
  }

  public getState(): GitState {
    // Return deep copy
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(state: GitState) {
    this.state = JSON.parse(JSON.stringify(state));
    this.history = [this.state];
    this.historyIndex = 0;
  }

  private pushHistory(state: GitState) {
    // Truncate future history if we were in undo state
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(JSON.parse(JSON.stringify(state)));
    this.historyIndex = this.history.length - 1;
  }

  public undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      return true;
    }
    return false;
  }

  public redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      return true;
    }
    return false;
  }

  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  public getActiveCommitId(): string {
    if (this.state.head.startsWith("ref: refs/heads/")) {
      const branchName = this.state.head.substring("ref: refs/heads/".length);
      return this.state.branches[branchName] || "C0";
    }
    return this.state.head;
  }

  public getActiveBranchName(): string | null {
    if (this.state.head.startsWith("ref: refs/heads/")) {
      return this.state.head.substring("ref: refs/heads/".length);
    }
    return null;
  }

  // Parses reference (branch, tag, or commit ID) to commit ID
  public resolveRef(ref: string): string | null {
    ref = ref.trim();
    if (this.state.commits[ref]) return ref;
    if (this.state.branches[ref]) return this.state.branches[ref];
    if (this.state.tags[ref]) return this.state.tags[ref];
    
    // HEAD relative syntax: e.g. main~1, HEAD~2, C2^
    if (ref.includes("~") || ref.includes("^")) {
      return this.resolveRelativeRef(ref);
    }

    if (ref.toUpperCase() === "HEAD") {
      return this.getActiveCommitId();
    }

    return null;
  }

  private resolveRelativeRef(ref: string): string | null {
    let current: string | null = null;
    let parts: string[] = [];
    
    // Split by ~ or ^ while keeping the delimiters
    let currentPart = "";
    for (let i = 0; i < ref.length; i++) {
      const char = ref[i];
      if (char === "~" || char === "^") {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = "";
        }
        parts.push(char);
      } else {
        currentPart += char;
      }
    }
    if (currentPart) parts.push(currentPart);

    if (parts.length === 0) return null;

    // Resolve base ref (first part)
    const base = parts[0];
    if (base === "~" || base === "^") {
      current = this.getActiveCommitId();
      parts.unshift("HEAD"); // Treat as HEAD~ or HEAD^
    } else {
      current = this.resolveRef(base);
    }

    if (!current) return null;

    let index = 1;
    while (index < parts.length) {
      const operator = parts[index];
      index++;

      if (operator === "~") {
        // Ancestor count
        let count = 1;
        if (index < parts.length && /^\d+$/.test(parts[index])) {
          count = parseInt(parts[index]);
          index++;
        }

        for (let i = 0; i < count; i++) {
          const parentCommit: GitCommit | undefined = this.state.commits[current!];
          if (!parentCommit || parentCommit.parents.length === 0) {
            return null; // No parent
          }
          current = parentCommit.parents[0]; // ~ always follows first parent
        }
      } else if (operator === "^") {
        // Parent index (1-based)
        let parentIndex = 1;
        if (index < parts.length && /^\d+$/.test(parts[index])) {
          parentIndex = parseInt(parts[index]);
          index++;
        }

        const parentCommit: GitCommit | undefined = this.state.commits[current!];
        if (!parentCommit || parentCommit.parents.length < parentIndex) {
          return null; // Parent index out of bounds
        }
        current = parentCommit.parents[parentIndex - 1];
      }
    }

    return current;
  }

  // Main entry point for executing git commands
  public execute(commandStr: string): CommandResult {
    const trimmed = commandStr.trim();
    if (!trimmed) {
      return { success: true, message: "", output: "", stateChanged: false };
    }

    // Split args but respect quotes for commit messages
    const args: string[] = [];
    let currentArg = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if ((char === '"' || char === "'") && (i === 0 || trimmed[i - 1] !== '\\')) {
        if (inQuotes && char === quoteChar) {
          inQuotes = false;
        } else if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        }
      } else if (char === " " && !inQuotes) {
        if (currentArg) {
          args.push(currentArg);
          currentArg = "";
        }
      } else {
        currentArg += char;
      }
    }
    if (currentArg) {
      args.push(currentArg);
    }

    if (args[0] !== "git") {
      return {
        success: false,
        message: "Command must start with 'git'",
        output: "",
        error: `Error: Command not recognized: '${args[0]}'. Did you mean 'git'?`,
        stateChanged: false,
      };
    }

    const action = args[1];
    if (!action) {
      return {
        success: false,
        message: "Please specify a git command.",
        output: "Usage: git [commit | checkout | switch | branch | merge | rebase | cherry-pick | reset | tag | log | status]",
        stateChanged: false,
      };
    }

    if (this.state.conflictState?.isConflicting) {
      return {
        success: false,
        message: "Unmerged paths",
        output: "error: you need to resolve your current index first",
        error: "fatal: Exiting because of an unresolved conflict.",
        stateChanged: false
      };
    }

    const newState = JSON.parse(JSON.stringify(this.state));

    switch (action) {
      case "commit":
        return this.handleCommit(args.slice(2), newState);
      case "checkout":
      case "switch":
        return this.handleCheckout(action, args.slice(2), newState);
      case "branch":
        return this.handleBranch(args.slice(2), newState);
      case "merge":
        return this.handleMerge(args.slice(2), newState);
      case "rebase":
        return this.handleRebase(args.slice(2), newState);
      case "cherry-pick":
        return this.handleCherryPick(args.slice(2), newState);
      case "reset":
        return this.handleReset(args.slice(2), newState);
      case "tag":
        return this.handleTag(args.slice(2), newState);
      case "log":
        return this.handleLog(args.slice(2));
      case "status":
        return this.handleStatus(newState);
      case "clone":
        return this.handleClone(args.slice(2), newState);
      case "fetch":
        return this.handleFetch(args.slice(2), newState);
      case "push":
        return this.handlePush(args.slice(2), newState);
      case "pull":
        return this.handlePull(args.slice(2), newState);
      default:
        return {
          success: false,
          message: `Unknown git command: '${action}'`,
          output: "",
          error: `git: '${action}' is not a git command. See 'git --help'.`,
          stateChanged: false,
        };
    }
  }

  private handleCommit(args: string[], newState: GitState): CommandResult {
    let message = "Another commit";
    
    // Find commit message
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-m" || args[i] === "--message") {
        if (i + 1 < args.length) {
          message = args[i + 1];
          break;
        } else {
          return {
            success: false,
            message: "Commit message missing after -m",
            output: "",
            error: "error: switch `m' requires a value",
            stateChanged: false,
          };
        }
      }
    }

    const parentId = this.getActiveCommitId();
    const parentCommit = this.state.commits[parentId];
    const newFiles = parentCommit && parentCommit.files 
      ? JSON.parse(JSON.stringify(parentCommit.files)) 
      : { "index.html": "<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>" };

    const activeBranch = this.getActiveBranchName();
    
    // Simulate file change so conflicts can occur
    if (activeBranch && newFiles["index.html"]) {
      newFiles["index.html"] += `\n<!-- Change from ${activeBranch} at ${Date.now()} -->`;
    }

    const newCommitId = `C${newState.nextCommitNum}`;
    newState.nextCommitNum++;

    const newCommit: GitCommit = {
      id: newCommitId,
      message,
      parents: [parentId],
      branch: activeBranch || "detached",
      timestamp: Date.now(),
      files: newFiles
    };

    newState.commits[newCommitId] = newCommit;

    // Update pointers
    if (activeBranch) {
      newState.branches[activeBranch] = newCommitId;
    } else {
      newState.head = newCommitId; // move detached HEAD
    }

    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Created commit ${newCommitId}`,
      output: `[${activeBranch || "detached-head"} ${newCommitId}] ${message}\n 1 file changed, 1 insertion(+)`,
      stateChanged: true,
    };
  }

  private handleCheckout(action: string, args: string[], newState: GitState): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: "Specify a branch or commit to checkout",
        output: `Usage: git ${action} <branch-or-commit-or-tag>`,
        stateChanged: false,
      };
    }

    // Checkout -b <branchName>
    if (args[0] === "-b" || (action === "switch" && args[0] === "-c")) {
      const newBranchName = args[1];
      if (!newBranchName) {
        return {
          success: false,
          message: "Specify a name for the new branch",
          output: "Usage: git checkout -b <branch-name>",
          stateChanged: false,
        };
      }

      if (newState.branches[newBranchName]) {
        return {
          success: false,
          message: `Branch '${newBranchName}' already exists`,
          output: "",
          error: `fatal: A branch named '${newBranchName}' already exists.`,
          stateChanged: false,
        };
      }

      const activeCommitId = this.getActiveCommitId();
      newState.branches[newBranchName] = activeCommitId;
      newState.head = `ref: refs/heads/${newBranchName}`;

      this.state = newState;
      this.pushHistory(this.state);

      return {
        success: true,
        message: `Created and switched to branch '${newBranchName}'`,
        output: `Switched to a new branch '${newBranchName}'`,
        stateChanged: true,
      };
    }

    const target = args[0];
    
    // Check if target is branch
    if (newState.branches[target]) {
      newState.head = `ref: refs/heads/${target}`;
      this.state = newState;
      this.pushHistory(this.state);
      return {
        success: true,
        message: `Switched to branch '${target}'`,
        output: `Switched to branch '${target}'`,
        stateChanged: true,
      };
    }

    // Check if target is resolved ref (commit or tag)
    const commitId = this.resolveRef(target);
    if (commitId) {
      newState.head = commitId; // Detached HEAD
      this.state = newState;
      this.pushHistory(this.state);
      return {
        success: true,
        message: `Switched to commit ${commitId} (detached HEAD)`,
        output: `Note: switching to '${target}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them...`,
        stateChanged: true,
      };
    }

    return {
      success: false,
      message: `Reference '${target}' not found`,
      output: "",
      error: `error: pathspec '${target}' did not match any file(s) known to git`,
      stateChanged: false,
    };
  }

  private handleBranch(args: string[], newState: GitState): CommandResult {
    if (args.length === 0) {
      // List branches
      const branchesList = Object.keys(newState.branches).map(name => {
        const active = this.getActiveBranchName() === name ? "* " : "  ";
        return `${active}${name}`;
      }).join("\n");
      return {
        success: true,
        message: "Listed branches",
        output: branchesList,
        stateChanged: false,
      };
    }

    // Delete branch: git branch -d <branch>
    if (args[0] === "-d" || args[0] === "-D") {
      const deleteBranchName = args[1];
      if (!deleteBranchName) {
        return {
          success: false,
          message: "Specify a branch name to delete",
          output: "Usage: git branch -d <branch-name>",
          stateChanged: false,
        };
      }

      if (!newState.branches[deleteBranchName]) {
        return {
          success: false,
          message: `Branch '${deleteBranchName}' not found`,
          output: "",
          error: `error: branch '${deleteBranchName}' not found.`,
          stateChanged: false,
        };
      }

      if (this.getActiveBranchName() === deleteBranchName) {
        return {
          success: false,
          message: `Cannot delete active branch '${deleteBranchName}'`,
          output: "",
          error: `error: Cannot delete branch '${deleteBranchName}' checked out at '${this.getActiveCommitId()}'`,
          stateChanged: false,
        };
      }

      delete newState.branches[deleteBranchName];
      this.state = newState;
      this.pushHistory(this.state);

      return {
        success: true,
        message: `Deleted branch '${deleteBranchName}'`,
        output: `Deleted branch ${deleteBranchName} (was ${this.state.branches[deleteBranchName]}).`,
        stateChanged: true,
      };
    }

    // Create branch: git branch <name>
    const newBranchName = args[0];
    if (newState.branches[newBranchName]) {
      return {
        success: false,
        message: `Branch '${newBranchName}' already exists`,
        output: "",
        error: `fatal: A branch named '${newBranchName}' already exists.`,
        stateChanged: false,
      };
    }

    const startCommit = args[1] ? this.resolveRef(args[1]) : this.getActiveCommitId();
    if (!startCommit) {
      return {
        success: false,
        message: `Start point '${args[1]}' not found`,
        output: "",
        error: `fatal: Not a valid object name: '${args[1]}'.`,
        stateChanged: false,
      };
    }

    newState.branches[newBranchName] = startCommit;
    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Created branch '${newBranchName}'`,
      output: ``,
      stateChanged: true,
    };
  }

  private handleMerge(args: string[], newState: GitState): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: "Specify a branch to merge",
        output: "Usage: git merge <branch>",
        stateChanged: false,
      };
    }

    const targetBranch = args[0];
    const targetCommitId = this.resolveRef(targetBranch);

    if (!targetCommitId) {
      return {
        success: false,
        message: `Branch/Commit '${targetBranch}' not found`,
        output: "",
        error: `merge: ${targetBranch} - not something we can merge`,
        stateChanged: false,
      };
    }

    const currentCommitId = this.getActiveCommitId();
    if (currentCommitId === targetCommitId) {
      return {
        success: true,
        message: "Already up-to-date",
        output: "Already up to date.",
        stateChanged: false,
      };
    }

    // Check ancestors
    const isTargetAncestor = this.isAncestor(targetCommitId, currentCommitId);
    if (isTargetAncestor) {
      return {
        success: true,
        message: "Already up-to-date",
        output: "Already up to date.",
        stateChanged: false,
      };
    }

    const activeBranch = this.getActiveBranchName();

    const isCurrentAncestor = this.isAncestor(currentCommitId, targetCommitId);
    if (isCurrentAncestor) {
      // Fast-forward merge
      if (activeBranch) {
        newState.branches[activeBranch] = targetCommitId;
      } else {
        newState.head = targetCommitId;
      }
      this.state = newState;
      this.pushHistory(this.state);
      return {
        success: true,
        message: `Fast-forwarded to ${targetBranch}`,
        output: `Updating ${currentCommitId.substring(0,7)}..${targetCommitId.substring(0,7)}\nFast-forward`,
        stateChanged: true,
      };
    }

    // 3-way merge commit
    const currentFiles = newState.commits[currentCommitId].files || {};
    const targetFiles = newState.commits[targetCommitId].files || {};
    
    // Check for simulated conflict
    if (currentFiles["index.html"] && targetFiles["index.html"] && currentFiles["index.html"] !== targetFiles["index.html"]) {
      // Find LCA files to be strictly correct, but for simulation simple difference is enough if they diverged
      newState.conflictState = {
        isConflicting: true,
        targetBranch: targetBranch,
        commandContext: "merge",
        fileContent: `<<<<<<< HEAD\n${currentFiles["index.html"]}\n=======\n${targetFiles["index.html"]}\n>>>>>>> ${targetBranch}`
      };
      
      this.state = newState;
      this.pushHistory(this.state);
      
      return {
        success: false,
        message: "Merge conflict",
        output: `Auto-merging index.html\nCONFLICT (content): Merge conflict in index.html\nAutomatic merge failed; fix conflicts and then commit the result.`,
        stateChanged: true
      };
    }

    const newCommitId = `C${newState.nextCommitNum}`;
    newState.nextCommitNum++;

    const mergeCommit: GitCommit = {
      id: newCommitId,
      message: `Merge branch '${targetBranch}' into ${activeBranch || "HEAD"}`,
      parents: [currentCommitId, targetCommitId],
      branch: activeBranch || "detached",
      timestamp: Date.now(),
      files: { "index.html": currentFiles["index.html"] }
    };

    newState.commits[newCommitId] = mergeCommit;

    if (activeBranch) {
      newState.branches[activeBranch] = newCommitId;
    } else {
      newState.head = newCommitId;
    }

    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Merged ${targetBranch} (Merge commit: ${newCommitId})`,
      output: `Merge made by the 'recursive' strategy.\n ${newCommitId} (merge commit)`,
      stateChanged: true,
    };
  }

  private handleRebase(args: string[], newState: GitState): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: "Specify a target branch to rebase onto",
        output: "Usage: git rebase [-i] <branch>",
        stateChanged: false,
      };
    }

    const isInteractive = args[0] === "-i" || args[0] === "--interactive";
    const targetBranch = isInteractive ? args[1] : args[0];

    if (!targetBranch) {
      return {
        success: false,
        message: "Specify a target branch",
        output: "Usage: git rebase [-i] <branch>",
        stateChanged: false,
      };
    }

    const targetCommitId = this.resolveRef(targetBranch);

    if (!targetCommitId) {
      return {
        success: false,
        message: `Target branch/commit '${targetBranch}' not found`,
        output: "",
        error: `fatal: no such branch/commit: ${targetBranch}`,
        stateChanged: false,
      };
    }

    const currentCommitId = this.getActiveCommitId();

    if (currentCommitId === targetCommitId) {
      return {
        success: true,
        message: "Current branch is up-to-date",
        output: "Current branch is up to date.",
        stateChanged: false,
      };
    }

    // Find common ancestor LCA
    const lcaId = this.findLCA(currentCommitId, targetCommitId);
    if (!lcaId) {
      return {
        success: false,
        message: "Could not find common ancestor to rebase",
        output: "",
        error: "fatal: no common ancestor found",
        stateChanged: false,
      };
    }

    if (lcaId === currentCommitId) {
      // Current is already ancestor of target - Fast Forward rebase
      const activeBranch = this.getActiveBranchName();
      if (activeBranch) {
        newState.branches[activeBranch] = targetCommitId;
      } else {
        newState.head = targetCommitId;
      }
      this.state = newState;
      this.pushHistory(this.state);
      return {
        success: true,
        message: `Fast-forwarded to ${targetBranch}`,
        output: `Successfully rebased and updated refs/heads/${activeBranch || "HEAD"}.`,
        stateChanged: true,
      };
    }

    // Get the path of commits from LCA to currentCommitId (excluding LCA)
    const commitPath = this.getCommitPath(lcaId, currentCommitId);
    if (commitPath.length === 0) {
      return {
        success: true,
        message: "No commits to replay",
        output: "Already up to date.",
        stateChanged: false,
      };
    }

    const activeBranch = this.getActiveBranchName();

    if (isInteractive) {
      newState.rebaseState = {
        isActive: true,
        commitsToRebase: commitPath,
        targetBase: targetCommitId,
        originalBranch: activeBranch || "HEAD"
      };
      
      this.state = newState;
      this.pushHistory(this.state);
      
      return {
        success: true,
        message: "Interactive rebase started",
        output: "Waiting for your editor to close the file...",
        stateChanged: true,
      };
    }

    // Replay commits one by one on top of targetCommitId
    let currentParent = targetCommitId;

    for (const commitToReplay of commitPath) {
      const sourceCommit = newState.commits[commitToReplay];
      const newCommitId = `C${newState.nextCommitNum}`;
      newState.nextCommitNum++;

      const replayedCommit: GitCommit = {
        id: newCommitId,
        message: sourceCommit.message + " (rebased)",
        parents: [currentParent],
        branch: activeBranch || "detached",
        timestamp: Date.now(),
      };

      newState.commits[newCommitId] = replayedCommit;
      currentParent = newCommitId;
    }

    // Update active branch pointer to the last replayed commit
    if (activeBranch) {
      newState.branches[activeBranch] = currentParent;
    } else {
      newState.head = currentParent;
    }

    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Rebased onto ${targetBranch} (Replayed ${commitPath.length} commits)`,
      output: `Successfully rebased and updated refs/heads/${activeBranch || "HEAD"}.`,
      stateChanged: true,
    };
  }

  private handleCherryPick(args: string[], newState: GitState): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: "Specify one or more commit IDs to cherry-pick",
        output: "Usage: git cherry-pick <commit1> [commit2 ...]",
        stateChanged: false,
      };
    }

    const activeBranch = this.getActiveBranchName();
    let currentParent = this.getActiveCommitId();
    const cherryPickedIds: string[] = [];

    for (const ref of args) {
      const targetCommitId = this.resolveRef(ref);
      if (!targetCommitId) {
        return {
          success: false,
          message: `Commit '${ref}' not found`,
          output: "",
          error: `fatal: bad revision '${ref}'`,
          stateChanged: false,
        };
      }

      const sourceCommit = newState.commits[targetCommitId];
      const newCommitId = `C${newState.nextCommitNum}`;
      newState.nextCommitNum++;

      const newCommit: GitCommit = {
        id: newCommitId,
        message: sourceCommit.message,
        parents: [currentParent],
        branch: activeBranch || "detached",
        timestamp: Date.now(),
        files: JSON.parse(JSON.stringify(sourceCommit.files || {}))
      };

      newState.commits[newCommitId] = newCommit;
      currentParent = newCommitId;
      cherryPickedIds.push(newCommitId);
    }

    // Update branch/head reference
    if (activeBranch) {
      newState.branches[activeBranch] = currentParent;
    } else {
      newState.head = currentParent;
    }

    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Cherry-picked commits: ${cherryPickedIds.join(", ")}`,
      output: `[${activeBranch || "detached"} ${cherryPickedIds[cherryPickedIds.length - 1]}] Cherry-pick successful`,
      stateChanged: true,
    };
  }

  private handleReset(args: string[], newState: GitState): CommandResult {
    let mode = "--mixed"; // default
    let targetIndex = 0;

    if (args[0] === "--hard" || args[0] === "--soft" || args[0] === "--mixed") {
      mode = args[0];
      targetIndex = 1;
    }

    const targetRef = args[targetIndex];
    if (!targetRef) {
      return {
        success: false,
        message: "Specify a commit/branch/tag to reset to",
        output: "Usage: git reset [--hard|--soft] <ref>",
        stateChanged: false,
      };
    }

    const targetCommitId = this.resolveRef(targetRef);
    if (!targetCommitId) {
      return {
        success: false,
        message: `Reference '${targetRef}' not found`,
        output: "",
        error: `fatal: ambiguous argument '${targetRef}': unknown revision`,
        stateChanged: false,
      };
    }

    const activeBranch = this.getActiveBranchName();
    if (activeBranch) {
      newState.branches[activeBranch] = targetCommitId;
    } else {
      newState.head = targetCommitId;
    }

    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Reset to ${targetRef} (${mode})`,
      output: `HEAD is now at ${targetCommitId.substring(0, 7)} ${newState.commits[targetCommitId].message}`,
      stateChanged: true,
    };
  }

  private handleTag(args: string[], newState: GitState): CommandResult {
    if (args.length === 0) {
      const tagsList = Object.keys(newState.tags).join("\n");
      return {
        success: true,
        message: "Listed tags",
        output: tagsList || "No tags defined.",
        stateChanged: false,
      };
    }

    const tagName = args[0];
    const targetRef = args[1] ? this.resolveRef(args[1]) : this.getActiveCommitId();

    if (!targetRef) {
      return {
        success: false,
        message: `Reference '${args[1]}' not found`,
        output: "",
        error: `fatal: Failed to resolve '${args[1]}' as a valid ref.`,
        stateChanged: false,
      };
    }

    newState.tags[tagName] = targetRef;
    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: `Created tag '${tagName}' pointing to '${targetRef}'`,
      output: "",
      stateChanged: true,
    };
  }

  private handleLog(_args: string[]): CommandResult {
    // Traverse down commit history from current node
    const activeId = this.getActiveCommitId();
    const visited = new Set<string>();
    const logEntries: string[] = [];

    const traverse = (id: string) => {
      if (!id || visited.has(id)) return;
      visited.add(id);

      const commit = this.state.commits[id];
      if (!commit) return;

      // Find any tags/branches pointing here
      const pointers: string[] = [];
      if (this.getActiveCommitId() === id) {
        if (this.getActiveBranchName()) {
          pointers.push(`HEAD -> ${this.getActiveBranchName()}`);
        } else {
          pointers.push("HEAD");
        }
      }
      Object.entries(this.state.branches).forEach(([name, cid]) => {
        if (cid === id && name !== this.getActiveBranchName()) {
          pointers.push(name);
        }
      });
      Object.entries(this.state.tags).forEach(([name, cid]) => {
        if (cid === id) {
          pointers.push(`tag: ${name}`);
        }
      });

      const refStr = pointers.length > 0 ? ` \u001b[33m(${pointers.join(", ")})\u001b[m` : "";
      logEntries.push(`\u001b[33mcommit ${id}\u001b[m${refStr}\nAuthor: baiyanjie <baiyanjie2002@163.com>\nDate:   ${new Date(commit.timestamp).toLocaleString()}\n\n    ${commit.message}\n`);

      // Traverse first parent for standard git log linear view
      if (commit.parents.length > 0) {
        traverse(commit.parents[0]);
      }
    };

    traverse(activeId);

    return {
      success: true,
      message: "Displayed git log",
      output: logEntries.join("\n"),
      stateChanged: false,
    };
  }

  private handleStatus(_newState: GitState): CommandResult {
    const activeBranch = this.getActiveBranchName();
    let statusText = "";
    if (activeBranch) {
      statusText += `On branch ${activeBranch}\n`;
    } else {
      statusText += `HEAD detached at ${this.getActiveCommitId()}\n`;
    }
    statusText += "nothing to commit, working tree clean";

    return {
      success: true,
      message: "Showed git status",
      output: statusText,
      stateChanged: false,
    };
  }

  private handleClone(args: string[], newState: GitState): CommandResult {
    const url = args[0];
    if (!url) {
      return { success: false, message: "Specify a URL to clone", output: "Usage: git clone <url>", stateChanged: false };
    }
    
    // Simulate cloning a remote repository that has some initial commits
    // We create a remote state with C0 and C1
    const remoteInitial: GitCommit = { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() - 10000 };
    const remoteFeature: GitCommit = { id: "C1", message: "Add some features", parents: ["C0"], branch: "main", timestamp: Date.now() - 5000 };
    
    newState.remoteState = {
      commits: { "C0": remoteInitial, "C1": remoteFeature },
      branches: { "main": "C1" },
      tags: {},
      head: "ref: refs/heads/main",
      url: url,
    };
    
    // Set local state to match remote state
    newState.commits = JSON.parse(JSON.stringify(newState.remoteState.commits));
    newState.branches = JSON.parse(JSON.stringify(newState.remoteState.branches));
    
    // Setup tracking branches (e.g., origin/main) in local branches as well
    newState.branches["origin/main"] = "C1";
    newState.head = "ref: refs/heads/main";
    newState.nextCommitNum = 2; // Since C0 and C1 are taken
    
    this.state = newState;
    this.pushHistory(this.state);
    
    return {
      success: true,
      message: `Cloned from ${url}`,
      output: `Cloning into 'repo'...\nremote: Enumerating objects: 6, done.\nremote: Counting objects: 100% (6/6), done.\nremote: Compressing objects: 100% (4/4), done.\nUnpacking objects: 100% (6/6), done.`,
      stateChanged: true
    };
  }

  private handleFetch(_args: string[], newState: GitState): CommandResult {
    if (!newState.remoteState) {
      return { success: false, message: "No remote repository configured", output: "fatal: No remote repository specified.", stateChanged: false };
    }
    
    let fetched = false;
    let fetchOutput = "";
    
    // Copy commits from remote to local
    for (const [id, commit] of Object.entries(newState.remoteState.commits)) {
      if (!newState.commits[id]) {
        newState.commits[id] = JSON.parse(JSON.stringify(commit));
        fetched = true;
      }
    }
    
    // Update tracking branches
    for (const [branch, commitId] of Object.entries(newState.remoteState.branches)) {
      const trackingName = `origin/${branch}`;
      if (newState.branches[trackingName] !== commitId) {
        newState.branches[trackingName] = commitId;
        fetched = true;
        fetchOutput += `   ${commitId.substring(0, 7)}..${commitId.substring(0, 7)}  ${branch} -> ${trackingName}\n`;
      }
    }
    
    if (fetched) {
      this.state = newState;
      this.pushHistory(this.state);
      return { success: true, message: "Fetched from origin", output: `From ${newState.remoteState.url}\n${fetchOutput}`, stateChanged: true };
    } else {
      return { success: true, message: "Already up to date", output: "", stateChanged: false };
    }
  }

  private handlePush(_args: string[], newState: GitState): CommandResult {
    if (!newState.remoteState) {
      return {
        success: false, message: "No remote repository configured", output: "fatal: No configured push destination.", stateChanged: false };
    }
    
    const activeBranch = this.getActiveBranchName();
    if (!activeBranch) {
      return { success: false, message: "HEAD detached", output: "fatal: You are not currently on a branch.", stateChanged: false };
    }
    
    const localCommitId = newState.branches[activeBranch];
    const remoteCommitId = newState.remoteState.branches[activeBranch] || "C0"; // fallback for new branch
    
    // Reject if remote is ahead and we don't force push
    if (remoteCommitId && remoteCommitId !== localCommitId) {
      const isAncestor = this.isAncestor(remoteCommitId, localCommitId);
      if (!isAncestor) {
        return { 
          success: false, 
          message: "Push rejected (non-fast-forward)", 
          output: `To ${newState.remoteState.url}\n ! [rejected]        ${activeBranch} -> ${activeBranch} (non-fast-forward)\nerror: failed to push some refs`, 
          error: "Updates were rejected because the tip of your current branch is behind its remote counterpart. Integrate the remote changes (e.g. 'git pull ...') before pushing again.",
          stateChanged: false 
        };
      }
    }
    
    if (localCommitId === remoteCommitId) {
      return { success: true, message: "Everything up-to-date", output: "Everything up-to-date", stateChanged: false };
    }
    
    // Copy local commits to remote
    for (const [id, commit] of Object.entries(newState.commits)) {
      if (!newState.remoteState.commits[id]) {
        newState.remoteState.commits[id] = JSON.parse(JSON.stringify(commit));
      }
    }
    
    newState.remoteState.branches[activeBranch] = localCommitId;
    newState.branches[`origin/${activeBranch}`] = localCommitId; // Update tracking branch
    
    this.state = newState;
    this.pushHistory(this.state);
    
    return {
      success: true,
      message: `Pushed to origin/${activeBranch}`,
      output: `To ${newState.remoteState.url}\n   ${remoteCommitId.substring(0, 7)}..${localCommitId.substring(0, 7)}  ${activeBranch} -> ${activeBranch}`,
      stateChanged: true
    };
  }

  private handlePull(_args: string[], newState: GitState): CommandResult {
    if (!newState.remoteState) {
      return { success: false, message: "No remote repository configured", output: "fatal: No remote repository specified.", stateChanged: false };
    }
    
    // pull = fetch + merge
    const fetchRes = this.handleFetch([], newState);
    if (!fetchRes.success) return fetchRes;
    
    const activeBranch = this.getActiveBranchName();
    if (!activeBranch) {
      return { success: false, message: "HEAD detached", output: "fatal: You are not currently on a branch.", stateChanged: false };
    }
    
    const trackingName = `origin/${activeBranch}`;
    if (!this.state.branches[trackingName] && !newState.branches[trackingName]) {
      return { success: false, message: `No tracking branch ${trackingName}`, output: `fatal: remote branch ${activeBranch} not found.`, stateChanged: false };
    }
    
    return this.handleMerge([trackingName], newState);
  }

  // LCA helper
  private findLCA(c1: string, c2: string): string | null {
    const ancestors2 = this.getAncestors(c2);

    // BFS or simple check for intersection, returning the one with minimum path length
    const queue = [c1];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (ancestors2.has(curr)) {
        return curr;
      }
      visited.add(curr);
      const commit = this.state.commits[curr];
      if (commit) {
        for (const p of commit.parents) {
          if (!visited.has(p)) {
            queue.push(p);
          }
        }
      }
    }
    return null;
  }

  private getAncestors(commitId: string): Set<string> {
    const set = new Set<string>();
    const stack = [commitId];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (!set.has(curr)) {
        set.add(curr);
        const commit = this.state.commits[curr];
        if (commit) {
          stack.push(...commit.parents);
        }
      }
    }
    return set;
  }

  private isAncestor(ancestor: string, descendant: string): boolean {
    const ancestors = this.getAncestors(descendant);
    return ancestors.has(ancestor);
  }

  // Helper to get linear path of commits between start (exclusive) and end (inclusive)
  // Assumes start is an ancestor of end
  private getCommitPath(start: string, end: string): string[] {
    const path: string[] = [];
    let current = end;

    while (current !== start) {
      path.push(current);
      const commit = this.state.commits[current];
      if (!commit || commit.parents.length === 0) {
        break;
      }
      // Rebase is path tracing. Follow 1st parent
      current = commit.parents[0];
    }

    return path.reverse();
  }

  public resolveConflict(resolvedContent: string): CommandResult {
    const newState = JSON.parse(JSON.stringify(this.state));
    if (!newState.conflictState || !newState.conflictState.isConflicting) {
      return { success: false, message: "No conflict", output: "", stateChanged: false };
    }
    
    const { targetBranch, commandContext } = newState.conflictState;
    const currentCommitId = this.getActiveCommitId();
    const targetCommitId = this.resolveRef(targetBranch);
    
    delete newState.conflictState;
    
    const activeBranch = this.getActiveBranchName();
    
    if (commandContext === "merge") {
      const newCommitId = `C${newState.nextCommitNum}`;
      newState.nextCommitNum++;
      
      const mergeCommit: GitCommit = {
        id: newCommitId,
        message: `Merge branch '${targetBranch}' into ${activeBranch || "HEAD"}`,
        parents: [currentCommitId, targetCommitId!],
        branch: activeBranch || "detached",
        timestamp: Date.now(),
        files: { "index.html": resolvedContent }
      };
      
      newState.commits[newCommitId] = mergeCommit;
      
      if (activeBranch) {
        newState.branches[activeBranch] = newCommitId;
      } else {
        newState.head = newCommitId;
      }
      
      this.state = newState;
      this.pushHistory(this.state);
      
      return { success: true, message: `Merge resolved`, output: `[${activeBranch || "detached"}] Merge resolved`, stateChanged: true };
    }
    
    return { success: false, message: "Context not supported", output: "", stateChanged: false };
  }

  public executeInteractiveRebase(actions: { commitId: string, action: "pick" | "squash" | "drop" }[]): CommandResult {
    const newState = JSON.parse(JSON.stringify(this.state));
    if (!newState.rebaseState || !newState.rebaseState.isActive) {
      return { success: false, message: "No active rebase", output: "", stateChanged: false };
    }

    const { targetBase, originalBranch } = newState.rebaseState;
    delete newState.rebaseState;

    let currentParent = targetBase;
    let squashedMessage = "";
    let squashedFiles = {};

    for (const actionItem of actions) {
      const sourceCommit = newState.commits[actionItem.commitId];
      if (!sourceCommit) continue;

      if (actionItem.action === "drop") {
        continue;
      }

      if (actionItem.action === "squash") {
        squashedMessage += `\n${sourceCommit.message}`;
        squashedFiles = { ...squashedFiles, ...(sourceCommit.files || {}) };
        // We do not create a commit yet, we wait until the next 'pick' or end of array
        continue;
      }

      if (actionItem.action === "pick") {
        const newCommitId = `C${newState.nextCommitNum}`;
        newState.nextCommitNum++;
        
        let finalMessage = sourceCommit.message;
        if (squashedMessage) {
          finalMessage += squashedMessage;
          squashedMessage = "";
        }

        const replayedCommit: GitCommit = {
          id: newCommitId,
          message: finalMessage,
          parents: [currentParent],
          branch: originalBranch,
          timestamp: Date.now(),
          files: { ...(sourceCommit.files || {}), ...squashedFiles }
        };

        newState.commits[newCommitId] = replayedCommit;
        currentParent = newCommitId;
        squashedFiles = {}; // reset
      }
    }
    
    // If there is lingering squashed message at the end without a pick, we must append it to the last created commit
    if (squashedMessage && currentParent !== targetBase) {
      newState.commits[currentParent].message += squashedMessage;
      newState.commits[currentParent].files = { ...newState.commits[currentParent].files, ...squashedFiles };
    }

    if (originalBranch !== "HEAD") {
      newState.branches[originalBranch] = currentParent;
      newState.head = `ref: refs/heads/${originalBranch}`;
    } else {
      newState.head = currentParent;
    }

    this.state = newState;
    this.pushHistory(this.state);

    return {
      success: true,
      message: "Interactive rebase complete",
      output: `Successfully rebased and updated refs/heads/${originalBranch}.`,
      stateChanged: true
    };
  }
}
