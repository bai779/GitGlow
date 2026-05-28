export type Language = "en" | "zh" | "ja" | "es";

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
    langToggle: "Language",
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
    langToggle: "选择语言",
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
  },
  ja: {
    brand: "GitGlow",
    challenges: "チャレンジ",
    cheatSheet: "チートシート",
    sandboxTitle: "🛝 フリーサンドボックス",
    sandboxDesc: "制限なしでGitコマンドを自由に練習",
    categoryBasics: "基本操作",
    categoryBranching: "ブランチとマージ",
    categoryAdvanced: "応用テクニック",
    sandboxModeLabel: "サンドボックスモード",
    challengeModeLabel: "チャレンジモード: レベル",
    resetBtn: "リセット",
    skipBtn: "スキップ",
    undoBtn: "元に戻す",
    redoBtn: "やり直し",
    objectiveLabel: "🎯 クリア目標:",
    hintSummary: "💡 ヒントが必要ですか？",
    successTitle: "チャレンジクリア！",
    successDesc: "素晴らしい！Gitツリーの状態を正常に変更し、目標を達成しました。",
    nextChallengeBtn: "次のレベルへ",
    goToSandboxBtn: "サンドボックスへ",
    dismissBtn: "閉じる",
    langToggle: "言語切替",
    terminalWelcome: "GitGlow ターミナル v1.0.0 へようこそ",
    terminalHelpTip: "利用可能なコマンドを表示するには 'help' と入力します。間違えた場合は 'git undo' で戻せます。",
    terminalHelpText: `GitGlow 利用可能なコマンドリスト:
  git commit -m "msg"   新しいコミットを作成
  git branch <name>       新しいブランチを作成
  git branch -d <name>    ブランチを削除
  git checkout <ref>      指定したブランチ/コミットに切り替え
  git checkout -b <name>  ブランチを作成して切り替える
  git merge <branch>      指定ブランチを現在のHEADにマージ
  git rebase <branch>     現在のブランチをターゲットブランチにリベース
  git cherry-pick <cid>   特定のコミットを現在のHEADにコピー
  git reset --hard <cid>  ブランチポインタを対象コミットに強制移動
  git tag <tag-name>      現在のコミットにタグを設定
  git log                 コミット履歴ログを表示
  git status              ワーキングツリーの状態を表示
  git undo / git redo     前のコマンドを取り消し / やり直し
  clear                   ターミナル画面を消去`,
    terminalUndoSuccess: "元に戻しました。",
    terminalUndoError: "このコンテキストでは元に戻せません。",
    terminalRedoSuccess: "やり直しました。",
    terminalRedoError: "このコンテキストではやり直せません。",
    terminalCommandError: "コマンドは 'git' で始まる必要があります",
    terminalUnknownCommand: "は認識されていない git コマンドです"
  },
  es: {
    brand: "GitGlow",
    challenges: "Desafíos",
    cheatSheet: "Hoja de Ruta",
    sandboxTitle: "🛝 Modo Sandbox Libre",
    sandboxDesc: "Practica comandos de git sin restricciones",
    categoryBasics: "Conceptos Básicos",
    categoryBranching: "Ramificaciones",
    categoryAdvanced: "Técnicas Avanzadas",
    sandboxModeLabel: "Modo Sandbox",
    challengeModeLabel: "Modo Desafío: Nivel",
    resetBtn: "Reiniciar",
    skipBtn: "Omitir",
    undoBtn: "Deshacer",
    redoBtn: "Rehacer",
    objectiveLabel: "🎯 Objetivo:",
    hintSummary: "💡 ¿Necesitas una pista?",
    successTitle: "¡Desafío Resuelto!",
    successDesc: "¡Excelente trabajo! Has resuelto con éxito el estado de git y cumplido los objetivos.",
    nextChallengeBtn: "Siguiente Desafío",
    goToSandboxBtn: "Ir a Sandbox",
    dismissBtn: "Cerrar",
    langToggle: "Idioma",
    terminalWelcome: "Bienvenido a la Terminal GitGlow v1.0.0",
    terminalHelpTip: "Escribe 'help' para ver los comandos disponibles. Usa 'git undo' si cometes un error.",
    terminalHelpText: `Comandos disponibles en GitGlow:
  git commit -m "msg"   Crear un nuevo commit
  git branch <nombre>     Crear una nueva rama
  git branch -d <nombre>  Eliminar una rama
  git checkout <ref>      Cambiar a una rama o commit específico
  git checkout -b <nom>   Crear y cambiar a una nueva rama
  git merge <rama>        Fusionar rama en el HEAD activo
  git rebase <rama>       Rebasar rama activa sobre la rama destino
  git cherry-pick <cid>   Copiar un commit en el HEAD activo
  git reset --hard <cid>  Mover puntero de rama al commit indicado
  git tag <nombre-tag>    Crear una etiqueta en el commit activo
  git log                 Mostrar el historial de commits
  git status              Mostrar el estado del área de trabajo
  git undo / git redo     Deshacer / rehacer la última acción
  clear                   Limpiar la pantalla de la terminal`,
    terminalUndoSuccess: "Deshecho correctamente.",
    terminalUndoError: "Deshacer no está soportado en este contexto.",
    terminalRedoSuccess: "Rehecho correctamente.",
    terminalRedoError: "Rehacer no está soportado en este contexto.",
    terminalCommandError: "El comando debe empezar con 'git'",
    terminalUnknownCommand: "no es un comando de git válido"
  }
};
