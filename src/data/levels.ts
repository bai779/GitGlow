import type { GitState } from "../logic/gitEngine";

export interface GitLevel {
  id: number;
  category: "Basics" | "Branching" | "Advanced";
  difficulty: "Easy" | "Medium" | "Hard";
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  goalEn: string;
  goalZh: string;
  hintEn: string;
  hintZh: string;
  initialState: GitState;
  validate: (state: GitState) => boolean;
}

export const GIT_LEVELS: GitLevel[] = [
  {
    id: 1,
    category: "Basics",
    difficulty: "Easy",
    titleEn: "1. Commit Basics",
    titleZh: "1. 提交基础",
    descriptionEn: "A commit in a git repository records a snapshot of all the files in your directory. Let's make some commits!",
    descriptionZh: "Git 仓库中的每一次提交都记录了您目录中所有文件的快照。让我们进行一些提交吧！",
    goalEn: "Make two new commits on the `main` branch. This will create C1 and C2.",
    goalZh: "在 `main` 分支上进行两次新提交，这将创建 C1 和 C2。",
    hintEn: "Type `git commit` in the terminal twice. You can add a message with `-m 'your message'`.",
    hintZh: "在终端中运行 `git commit` 两次。您可以使用 `-m '您的提交信息'` 添加提交说明。",
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
      return !!state.commits["C1"] && !!state.commits["C2"] && state.branches["main"] === "C2";
    }
  },
  {
    id: 2,
    category: "Basics",
    difficulty: "Easy",
    titleEn: "2. Creating a Branch",
    titleZh: "2. 创建分支",
    descriptionEn: "Branches in Git are incredibly lightweight. They are simply pointers to a specific commit. Creating a branch helps you isolate experimental code.",
    descriptionZh: "Git 中的分支非常轻量。它们仅仅是指向特定提交的指针。创建分支可以帮助您隔离实验性的代码。",
    goalEn: "Create a new branch named `bugFix` and switch to it so that new commits will be recorded on it.",
    goalZh: "创建一个名为 `bugFix` 的新分支并切换到它，以便新的提交能记录在该分支上。",
    hintEn: "You can do this in two commands: `git branch bugFix` followed by `git checkout bugFix`. Or shortcut: `git checkout -b bugFix`.",
    hintZh: "您可以使用两条命令完成：先运行 `git branch bugFix`，然后运行 `git checkout bugFix`。或者使用快捷方式：`git checkout -b bugFix`。",
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
      return !!state.branches["bugFix"] && state.head === "ref: refs/heads/bugFix";
    }
  },
  {
    id: 3,
    category: "Basics",
    difficulty: "Easy",
    titleEn: "3. Branching & Committing",
    titleZh: "3. 分支与提交",
    descriptionEn: "Now let's combine branching and committing. Working on a branch isolates your changes from the main line.",
    descriptionZh: "现在让我们将分支与提交结合起来。在分支上工作可以将您的修改与主线隔离开来。",
    goalEn: "Create a branch named `bugFix`, checkout to it, and make one new commit (creating C1).",
    goalZh: "创建一个名为 `bugFix` 的分支，切换到它，并进行一次新提交（创建 C1）。",
    hintEn: "Run `git checkout -b bugFix` and then run `git commit`.",
    hintZh: "运行 `git checkout -b bugFix`，然后运行 `git commit`。",
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
      return state.branches["bugFix"] === "C1" && state.branches["main"] === "C0" && state.head === "ref: refs/heads/bugFix";
    }
  },
  {
    id: 4,
    category: "Branching",
    difficulty: "Medium",
    titleEn: "4. Merging Branches",
    titleZh: "4. 合并分支",
    descriptionEn: "Merging joins two or more development histories together. When we merge in Git, a special 'merge commit' is created that has two parents.",
    descriptionZh: "合并可以将两条开发历史线连接在一起。在 Git 中合并时，会创建一个具有两个父节点的特殊“合并提交 (Merge Commit)”。",
    goalEn: "Merge the branch `bugFix` into `main` so that `main` contains the changes from both branches.",
    goalZh: "将分支 `bugFix` 合并到 `main` 中，使 `main` 包含两个分支的修改。",
    hintEn: "Ensure you are on the `main` branch first (`git checkout main`), then merge the target branch (`git merge bugFix`).",
    hintZh: "先确保您处于 `main` 分支（`git checkout main`），然后合并目标分支（`git merge bugFix`）。",
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
      const mainCommitId = state.branches["main"];
      if (!mainCommitId) return false;
      const mainCommit = state.commits[mainCommitId];
      if (!mainCommit) return false;
      return mainCommit.parents.includes("C1") && mainCommit.parents.includes("C2");
    }
  },
  {
    id: 5,
    category: "Branching",
    difficulty: "Medium",
    titleEn: "5. Rebase Introduction",
    titleZh: "5. 变基入门",
    descriptionEn: "Rebase is the second way to combine branches. Rebasing takes a set of commits, copies them, and replays them on top of another branch. This keeps the commit history flat and linear.",
    descriptionZh: "变基是结合分支的第二种方式。变基会提取一组提交，复制它们，并在另一个分支的顶部重新播放它们。这可以使提交历史保持扁平和线性。",
    goalEn: "Rebase the branch `bugFix` onto the `main` branch.",
    goalZh: "将分支 `bugFix` 变基（Rebase）到 `main` 分支上。",
    hintEn: "Make sure you are on `bugFix` (`git checkout bugFix`), and then rebase onto `main` (`git rebase main`).",
    hintZh: "确保您处于 `bugFix` 分支（`git checkout bugFix`），然后变基到 `main` 上（`git rebase main`）。",
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
      const bugFixCommitId = state.branches["bugFix"];
      if (!bugFixCommitId) return false;
      const bugFixCommit = state.commits[bugFixCommitId];
      if (!bugFixCommit) return false;
      return bugFixCommit.parents.includes("C1") && state.branches["main"] === "C1";
    }
  },
  {
    id: 6,
    category: "Advanced",
    difficulty: "Medium",
    titleEn: "6. Detached HEAD",
    titleZh: "6. 分离 HEAD",
    descriptionEn: "By default, HEAD points to the name of the active branch. Detaching HEAD means pointing it directly to a specific commit hash rather than a branch reference.",
    descriptionZh: "默认情况下，HEAD 指向当前活动分支的名称。分离 HEAD 意味着将其直接指向某个特定的提交哈希，而不是指向分支引用。",
    goalEn: "Detach HEAD and point it directly to commit `C1`.",
    goalZh: "分离 HEAD 并将其直接指向提交 `C1`。",
    hintEn: "Use `git checkout` followed by the commit ID: `git checkout C1`.",
    hintZh: "使用 `git checkout` 后面加上提交 ID：`git checkout C1`。",
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
      return state.head === "C1";
    }
  },
  {
    id: 7,
    category: "Advanced",
    difficulty: "Medium",
    titleEn: "7. Relative Refs (HEAD^)",
    titleZh: "7. 相对引用 (HEAD^)",
    descriptionEn: "Instead of typing out full commit hashes, you can use relative references: `^` moves HEAD up by 1 parent, and `~<num>` moves HEAD up by multiple steps.",
    descriptionZh: "与其每次都输入完整的提交哈希，您可以使用相对引用：`^` 将 HEAD 向上移动 1 个父节点，而 `~<数字>` 可以向上移动多个步骤。",
    goalEn: "Move your active check-out location (HEAD) to the parent of `C2`, which is `C1`.",
    goalZh: "将您的活动检出位置 (HEAD) 移动到 `C2` 的父节点，即 `C1`。",
    hintEn: "Make sure you checkout using relative reference. If checkout is active on main/C2, you can use `git checkout HEAD^` or `git checkout main^`.",
    hintZh: "确保您使用相对引用检出。如果当前在 main/C2 上，您可以使用 `git checkout HEAD^` 或 `git checkout main^`。",
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
      return state.head === "C1";
    }
  },
  {
    id: 8,
    category: "Advanced",
    difficulty: "Medium",
    titleEn: "8. Resetting Commits",
    titleZh: "8. 撤销提交 (git reset)",
    descriptionEn: "`git reset` moves the current branch pointer backward in history. It is a way to undo commits as if they never happened.",
    descriptionZh: "`git reset` 会将当前分支指针在历史中向后移动。这是一种撤销提交的方法，使它们好像从未发生过一样。",
    goalEn: "Undo the last commit on the `local` branch so that it points to `C1` instead of `C2`.",
    goalZh: "撤销 `local` 分支上的上一次提交，使其指向 `C1` 而不是 `C2`。",
    hintEn: "Make sure you are on `local`, then run `git reset HEAD^` or `git reset C1`.",
    hintZh: "确保您处于 `local` 分支，然后运行 `git reset HEAD^` 或 `git reset C1`。",
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
      return state.branches["local"] === "C1";
    }
  },
  {
    id: 9,
    category: "Advanced",
    difficulty: "Medium",
    titleEn: "9. Cherry-picking",
    titleZh: "9. 提交拣选 (git cherry-pick)",
    descriptionEn: "`git cherry-pick` is a very powerful command. It copies one or more commits from elsewhere and appends them onto your current HEAD.",
    descriptionZh: "`git cherry-pick` 是一个非常强大的命令。它会复制一个或多个其他地方的提交，并将它们追加到您当前的 HEAD 顶部。",
    goalEn: "Copy commits `C2` and `C3` from the `dev` branch and place them onto `main` branch.",
    goalZh: "复制 `dev` 分支上的提交 `C2` 和 `C3` 并将它们放到 `main` 分支上。",
    hintEn: "Checkout `main` first (`git checkout main`), then cherry-pick both commits: `git cherry-pick C2 C3`.",
    hintZh: "先检出到 `main` 分支（`git checkout main`），然后拣选这两个提交：`git cherry-pick C2 C3`。",
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
      const mainCommitId = state.branches["main"];
      if (!mainCommitId) return false;
      const mainCommit = state.commits[mainCommitId];
      if (!mainCommit) return false;

      const parentId = mainCommit.parents[0];
      if (!parentId) return false;
      const parentCommit = state.commits[parentId];
      if (!parentCommit) return false;

      return parentCommit.parents.includes("C1") && 
             mainCommit.message === "Feature element B" && 
             parentCommit.message === "Feature element A";
    }
  },
  {
    id: 10,
    category: "Branching",
    difficulty: "Hard",
    titleEn: "10. Rebase & Merge",
    titleZh: "10. 变基与合并",
    descriptionEn: "Let's perform a workflow rebase and merge: rebase a feature branch, then fast-forward merge it back to the main branch.",
    descriptionZh: "让我们执行一次工作流变基与合并操作：先变基一个特性分支，然后快进（Fast-Forward）合并它回到主分支。",
    goalEn: "First, rebase `bugFix` onto `main`. Then, fast-forward merge `main` to catch up with `bugFix`.",
    goalZh: "首先，将 `bugFix` 变基到 `main`。然后，快进合并 `main` 以赶上 `bugFix`。",
    hintEn: "1) `git checkout bugFix` -> `git rebase main` \n2) `git checkout main` -> `git merge bugFix`",
    hintZh: "1) `git checkout bugFix` -> `git rebase main` \n2) `git checkout main` -> `git merge bugFix`",
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
      const mainCommitId = state.branches["main"];
      const bugFixCommitId = state.branches["bugFix"];
      if (!mainCommitId || mainCommitId !== bugFixCommitId) return false;
      const commit = state.commits[mainCommitId];
      if (!commit) return false;
      return commit.parents.includes("C1") && state.head === "ref: refs/heads/main";
    }
  }
];
