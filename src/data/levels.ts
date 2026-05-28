import type { GitState } from "../logic/gitEngine";

export interface GitLevel {
  id: number;
  title: string;
  category: "Basics" | "Branching" | "Advanced";
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  goal: string;
  hint: string;
  initialState: GitState;
  validate: (state: GitState) => boolean;
}

export const GIT_LEVELS: GitLevel[] = [
  {
    id: 1,
    title: "1. Commit Basics",
    category: "Basics",
    difficulty: "Easy",
    description: "A commit in a git repository records a snapshot of all the files in your directory. Let's make some commits!",
    goal: "Make two new commits on the `main` branch. This will create C1 and C2.",
    hint: "Type `git commit` in the terminal twice. You can add a message with `-m 'your message'`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() }
      },
      branches: { "main": "C0" },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 1
    },
    validate: (state) => {
      // Must have C1 and C2, and main points to C2
      return !!state.commits["C1"] && !!state.commits["C2"] && state.branches["main"] === "C2";
    }
  },
  {
    id: 2,
    title: "2. Creating a Branch",
    category: "Basics",
    difficulty: "Easy",
    description: "Branches in Git are incredibly lightweight. They are simply pointers to a specific commit. Creating a branch helps you isolate experimental code.",
    goal: "Create a new branch named `bugFix` and switch to it so that new commits will be recorded on it.",
    hint: "You can do this in two commands: `git branch bugFix` followed by `git checkout bugFix`. Or shortcut: `git checkout -b bugFix`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() }
      },
      branches: { "main": "C0" },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 1
    },
    validate: (state) => {
      // bugFix branch must exist and HEAD must point to bugFix
      return !!state.branches["bugFix"] && state.head === "ref: refs/heads/bugFix";
    }
  },
  {
    id: 3,
    title: "3. Branching & Committing",
    category: "Basics",
    difficulty: "Easy",
    description: "Now let's combine branching and committing. Working on a branch isolates your changes from the main line.",
    goal: "Create a branch named `bugFix`, checkout to it, and make one new commit (creating C1).",
    hint: "Run `git checkout -b bugFix` and then run `git commit`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() }
      },
      branches: { "main": "C0" },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 1
    },
    validate: (state) => {
      // bugFix must point to C1, main points to C0, HEAD points to bugFix
      return state.branches["bugFix"] === "C1" && state.branches["main"] === "C0" && state.head === "ref: refs/heads/bugFix";
    }
  },
  {
    id: 4,
    title: "4. Merging Branches",
    category: "Branching",
    difficulty: "Medium",
    description: "Merging joins two or more development histories together. When we merge in Git, a special 'merge commit' is created that has two parents.",
    goal: "Merge the branch `bugFix` into `main` so that `main` contains the changes from both branches.",
    hint: "Ensure you are on the `main` branch first (`git checkout main`), then merge the target branch (`git merge bugFix`).",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() },
        "C1": { id: "C1", message: "Work on main", parents: ["C0"], branch: "main", timestamp: Date.now() },
        "C2": { id: "C2", message: "Fix bug", parents: ["C0"], branch: "bugFix", timestamp: Date.now() }
      },
      branches: {
        "main": "C1",
        "bugFix": "C2"
      },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 3
    },
    validate: (state) => {
      // The current active branch main must point to a commit that has C1 and C2 as parents.
      const mainCommitId = state.branches["main"];
      if (!mainCommitId) return false;
      const mainCommit = state.commits[mainCommitId];
      if (!mainCommit) return false;
      
      // Check if it's a merge commit with parents containing C1 and C2
      return mainCommit.parents.includes("C1") && mainCommit.parents.includes("C2");
    }
  },
  {
    id: 5,
    title: "5. Rebase Introduction",
    category: "Branching",
    difficulty: "Medium",
    description: "Rebase is the second way to combine branches. Rebasing takes a set of commits, copies them, and replays them on top of another branch. This keeps the commit history flat and linear.",
    goal: "Rebase the branch `bugFix` onto the `main` branch.",
    hint: "Make sure you are on `bugFix` (`git checkout bugFix`), and then rebase onto `main` (`git rebase main`).",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() },
        "C1": { id: "C1", message: "Work on main", parents: ["C0"], branch: "main", timestamp: Date.now() },
        "C2": { id: "C2", message: "Fix bug", parents: ["C0"], branch: "bugFix", timestamp: Date.now() }
      },
      branches: {
        "main": "C1",
        "bugFix": "C2"
      },
      tags: {},
      head: "ref: refs/heads/bugFix",
      nextCommitNum: 3
    },
    validate: (state) => {
      // bugFix must point to a new commit (like C3 or C3 (rebased)) whose parent is C1 (the target we rebased onto).
      const bugFixCommitId = state.branches["bugFix"];
      if (!bugFixCommitId) return false;
      
      const bugFixCommit = state.commits[bugFixCommitId];
      if (!bugFixCommit) return false;
      
      // The parent of the rebased commit must be C1 (main)
      return bugFixCommit.parents.includes("C1") && state.branches["main"] === "C1";
    }
  },
  {
    id: 6,
    title: "6. Detached HEAD",
    category: "Advanced",
    difficulty: "Medium",
    description: "By default, HEAD points to the name of the active branch. Detaching HEAD means pointing it directly to a specific commit hash rather than a branch reference.",
    goal: "Detach HEAD and point it directly to commit `C1`.",
    hint: "Use `git checkout` followed by the commit ID: `git checkout C1`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() },
        "C1": { id: "C1", message: "Commit 1", parents: ["C0"], branch: "main", timestamp: Date.now() },
        "C2": { id: "C2", message: "Commit 2", parents: ["C1"], branch: "main", timestamp: Date.now() }
      },
      branches: { "main": "C2" },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 3
    },
    validate: (state) => {
      // HEAD must be exactly "C1" (detached)
      return state.head === "C1";
    }
  },
  {
    id: 7,
    title: "7. Relative Refs (HEAD^)",
    category: "Advanced",
    difficulty: "Medium",
    description: "Instead of typing out full commit hashes, you can use relative references: `^` moves HEAD up by 1 parent, and `~<num>` moves HEAD up by multiple steps.",
    goal: "Move your active check-out location (HEAD) to the parent of `C2`, which is `C1`.",
    hint: "Make sure you checkout using relative reference. If checkout is active on main/C2, you can use `git checkout HEAD^` or `git checkout main^`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() },
        "C1": { id: "C1", message: "Commit 1", parents: ["C0"], branch: "main", timestamp: Date.now() },
        "C2": { id: "C2", message: "Commit 2", parents: ["C1"], branch: "main", timestamp: Date.now() }
      },
      branches: { "main": "C2" },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 3
    },
    validate: (state) => {
      // HEAD must be "C1" (the parent of C2)
      return state.head === "C1";
    }
  },
  {
    id: 8,
    title: "8. Resetting Commits",
    category: "Advanced",
    difficulty: "Medium",
    description: "`git reset` moves the current branch pointer backward in history. It is a way to undo commits as if they never happened.",
    goal: "Undo the last commit on the `local` branch so that it points to `C1` instead of `C2`.",
    hint: "Make sure you are on `local`, then run `git reset HEAD^` or `git reset C1`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "local", timestamp: Date.now() },
        "C1": { id: "C1", message: "Save work", parents: ["C0"], branch: "local", timestamp: Date.now() },
        "C2": { id: "C2", message: "Accidental commit", parents: ["C1"], branch: "local", timestamp: Date.now() }
      },
      branches: { "local": "C2" },
      tags: {},
      head: "ref: refs/heads/local",
      nextCommitNum: 3
    },
    validate: (state) => {
      // local branch must point to C1
      return state.branches["local"] === "C1";
    }
  },
  {
    id: 9,
    title: "9. Cherry-picking",
    category: "Advanced",
    difficulty: "Medium",
    description: "`git cherry-pick` is a very powerful command. It copies one or more commits from elsewhere and appends them onto your current HEAD.",
    goal: "Copy commits `C2` and `C3` from the `dev` branch and place them onto `main` branch.",
    hint: "Checkout `main` first (`git checkout main`), then cherry-pick both commits: `git cherry-pick C2 C3`.",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() },
        "C1": { id: "C1", message: "First main commit", parents: ["C0"], branch: "main", timestamp: Date.now() },
        "C2": { id: "C2", message: "Feature element A", parents: ["C0"], branch: "dev", timestamp: Date.now() },
        "C3": { id: "C3", message: "Feature element B", parents: ["C2"], branch: "dev", timestamp: Date.now() }
      },
      branches: {
        "main": "C1",
        "dev": "C3"
      },
      tags: {},
      head: "ref: refs/heads/main",
      nextCommitNum: 4
    },
    validate: (state) => {
      // main branch must point to a new commit (say C5) whose parent is a commit (say C4), whose parent is C1.
      // C4 must have message identical to C2, C5 must have message identical to C3.
      const mainCommitId = state.branches["main"];
      if (!mainCommitId) return false;
      const mainCommit = state.commits[mainCommitId];
      if (!mainCommit) return false;

      // Parent of main must be another commit on main
      const parentId = mainCommit.parents[0];
      if (!parentId) return false;
      const parentCommit = state.commits[parentId];
      if (!parentCommit) return false;

      // Root of replayed commits must be C1
      return parentCommit.parents.includes("C1") && 
             mainCommit.message === "Feature element B" && 
             parentCommit.message === "Feature element A";
    }
  },
  {
    id: 10,
    title: "10. Rebase & Merge",
    category: "Branching",
    difficulty: "Hard",
    description: "Let's perform a workflow rebase and merge: rebase a feature branch, then fast-forward merge it back to the main branch.",
    goal: "First, rebase `bugFix` onto `main`. Then, fast-forward merge `main` to catch up with `bugFix`.",
    hint: "1) `git checkout bugFix` -> `git rebase main` \n2) `git checkout main` -> `git merge bugFix`",
    initialState: {
      commits: {
        "C0": { id: "C0", message: "Initial commit", parents: [], branch: "main", timestamp: Date.now() },
        "C1": { id: "C1", message: "Work on main", parents: ["C0"], branch: "main", timestamp: Date.now() },
        "C2": { id: "C2", message: "Fix bug", parents: ["C0"], branch: "bugFix", timestamp: Date.now() }
      },
      branches: {
        "main": "C1",
        "bugFix": "C2"
      },
      tags: {},
      head: "ref: refs/heads/bugFix",
      nextCommitNum: 3
    },
    validate: (state) => {
      // Both main and bugFix must point to the same rebased commit (which has parent C1)
      const mainCommitId = state.branches["main"];
      const bugFixCommitId = state.branches["bugFix"];
      if (!mainCommitId || mainCommitId !== bugFixCommitId) return false;

      const commit = state.commits[mainCommitId];
      if (!commit) return false;

      return commit.parents.includes("C1") && state.head === "ref: refs/heads/main";
    }
  }
];
