export type Language = "en" | "zh";

export const UI_TRANSLATIONS = {
  en: {
    brand: "GitGlow",
    challenges: "Challenges",
    cheatSheet: "Cheat Sheet",
    sandboxTitle: "🛝 Free Sandbox Mode",
    sandboxDesc: "Practice git commands with zero restrictions",
    categoryBasics: "Basics",
    categoryBranching: "Branching",
    categoryAdvanced: "Advanced",
    sandboxModeLabel: "Sandbox Playground Mode",
    challengeModeLabel: "Challenge Mode: Level",
    resetBtn: "Reset",
    skipBtn: "Skip",
    undoBtn: "Undo",
    redoBtn: "Redo",
    objectiveLabel: "🎯 Objective:",
    hintSummary: "💡 Need a hint?",
    successTitle: "Challenge Solved!",
    successDesc: "Excellent job! You successfully resolved the git state and matched the objectives.",
    nextChallengeBtn: "Next Challenge",
    goToSandboxBtn: "Go to Sandbox",
    dismissBtn: "Dismiss",
    langToggle: "中文",
    terminalWelcome: "Welcome to GitGlow Terminal v1.0.0",
    terminalHelpTip: "Type 'help' to see available commands. Use 'git undo' if you make a mistake.",
    terminalHelpText: `GitGlow Available Commands:
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
    terminalUndoSuccess: "Undo successful.",
    terminalUndoError: "Undo not supported in this context.",
    terminalRedoSuccess: "Redo successful.",
    terminalRedoError: "Redo not supported in this context.",
    terminalCommandError: "Command must start with 'git'",
    terminalUnknownCommand: "Unknown git command"
  },
  zh: {
    brand: "GitGlow",
    challenges: "关卡挑战",
    cheatSheet: "指令速查",
    sandboxTitle: "🛝 自由沙盒模式",
    sandboxDesc: "无限制自由练习 Git 常用指令",
    categoryBasics: "基础入门",
    categoryBranching: "分支合并",
    categoryAdvanced: "高级技巧",
    sandboxModeLabel: "自由沙盒模式",
    challengeModeLabel: "挑战模式：第",
    resetBtn: "重置",
    skipBtn: "跳过",
    undoBtn: "撤销",
    redoBtn: "重做",
    objectiveLabel: "🎯 关卡目标：",
    hintSummary: "💡 需要提示吗？",
    successTitle: "挑战通关！",
    successDesc: "太棒了！您成功修改了 Git 分支树状态并达到了本关目标。",
    nextChallengeBtn: "下一关",
    goToSandboxBtn: "前往沙盒",
    dismissBtn: "关闭",
    langToggle: "English",
    terminalWelcome: "欢迎来到 GitGlow 终端 v1.0.0",
    terminalHelpTip: "输入 'help' 查看可用指令。如果做错了，可以使用 'git undo' 撤销。",
    terminalHelpText: `GitGlow 可用指令列表:
  git commit -m "msg"   创建新的提交
  git branch <name>       创建新分支
  git branch -d <name>    删除分支
  git checkout <ref>      切换 HEAD 到指定分支/提交
  git checkout -b <name>  创建并切换到新分支
  git merge <branch>      合并指定分支到当前分支
  git rebase <branch>     将当前分支变基到目标分支
  git cherry-pick <cid>   拣选指定提交复制到当前 HEAD
  git reset --hard <cid>  强制回滚分支指针到目标提交
  git tag <tag-name>      给当前提交打上静态标签
  git log                 显示线性提交历史日志
  git status              查看当前工作区状态
  git undo / git redo     撤销 / 重做上一步操作
  clear                   清空终端屏幕`,
    terminalUndoSuccess: "撤销成功。",
    terminalUndoError: "此上下文不支持撤销。",
    terminalRedoSuccess: "重做成功。",
    terminalRedoError: "此上下文不支持重做。",
    terminalCommandError: "指令必须以 'git' 开头",
    terminalUnknownCommand: "未知的 git 指令"
  }
};
