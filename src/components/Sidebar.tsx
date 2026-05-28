import React, { useState } from "react";
import type { GitLevel } from "../data/levels";
import type { Language } from "../data/translations";
import { UI_TRANSLATIONS } from "../data/translations";
import { Award, BookOpen, ChevronRight, HelpCircle, CheckCircle } from "lucide-react";

interface SidebarProps {
  levels: GitLevel[];
  currentLevelId: number | null; // null represents Sandbox
  completedLevelIds: number[];
  onSelectLevel: (levelId: number | null) => void;
  onCheatClick?: (cmdText: string) => void;
  lang: Language;
}

// Bilingual Cheat Sheet descriptions
const getCheatSheetItems = (lang: Language) => [
  {
    category: UI_TRANSLATIONS[lang].categoryBasics,
    commands: [
      { cmd: "git commit -m 'message'", desc: lang === "en" ? "Saves a snapshot of current project files" : "保存当前项目文件快照" },
      { cmd: "git branch <name>", desc: lang === "en" ? "Creates a new branch pointer" : "创建一个新分支指针" },
      { cmd: "git checkout <ref>", desc: lang === "en" ? "Switches HEAD to specified branch/commit" : "切换 HEAD 到指定分支/提交" },
      { cmd: "git checkout -b <name>", desc: lang === "en" ? "Creates a new branch and switches to it" : "创建并切换到新分支" }
    ]
  },
  {
    category: UI_TRANSLATIONS[lang].categoryBranching,
    commands: [
      { cmd: "git merge <branch>", desc: lang === "en" ? "Combines histories; creates a 3-way merge commit" : "合并历史；创建一个三方合并提交" },
      { cmd: "git rebase <branch>", desc: lang === "en" ? "Copies current branch's commits on top of target" : "将当前分支的提交复制到目标分支的顶部" }
    ]
  },
  {
    category: UI_TRANSLATIONS[lang].categoryAdvanced,
    commands: [
      { cmd: "git cherry-pick <cid>", desc: lang === "en" ? "Copies specific commit onto active HEAD" : "将指定提交复制到当前 HEAD 的顶部" },
      { cmd: "git reset --hard <cid>", desc: lang === "en" ? "Moves branch pointer back; discards local changes" : "强制回滚分支指针；丢弃本地未提交的内容" },
      { cmd: "git tag <tag-name>", desc: lang === "en" ? "Adds a static bookmark to current commit" : "给当前提交打上静态标记" },
      { cmd: "git log", desc: lang === "en" ? "Displays list of historical commits" : "显示线性历史提交日志" },
      { cmd: "git status", desc: lang === "en" ? "Displays branch state and changes" : "查看当前分支状态及工作区变动" }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  levels,
  currentLevelId,
  completedLevelIds,
  onSelectLevel,
  onCheatClick,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<"levels" | "cheat">("levels");

  const t = UI_TRANSLATIONS[lang];
  const cheatSheetItems = getCheatSheetItems(lang);

  // Group levels by category
  const categories = {
    Basics: levels.filter(l => l.category === "Basics"),
    Branching: levels.filter(l => l.category === "Branching"),
    Advanced: levels.filter(l => l.category === "Advanced")
  };

  return (
    <div className="sidebar-panel">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Award className="brand-icon" size={24} />
        <h2>{t.brand}</h2>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === "levels" ? "active" : ""}`}
          onClick={() => setActiveTab("levels")}
        >
          <BookOpen size={16} />
          <span>{t.challenges}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "cheat" ? "active" : ""}`}
          onClick={() => setActiveTab("cheat")}
        >
          <HelpCircle size={16} />
          <span>{t.cheatSheet}</span>
        </button>
      </div>

      {/* Panel Contents */}
      <div className="sidebar-content">
        {activeTab === "levels" ? (
          <div className="levels-section">
            {/* Sandbox Mode Option */}
            <div
              className={`level-item sandbox-item ${currentLevelId === null ? "active" : ""}`}
              onClick={() => onSelectLevel(null)}
            >
              <div className="level-item-info">
                <h4>{t.sandboxTitle}</h4>
                <p>{t.sandboxDesc}</p>
              </div>
              <ChevronRight size={18} />
            </div>

            {/* Level Categories */}
            {(Object.keys(categories) as Array<keyof typeof categories>).map(catKey => {
              const catLabel = catKey === "Basics" 
                ? t.categoryBasics 
                : catKey === "Branching" 
                ? t.categoryBranching 
                : t.categoryAdvanced;

              return (
                <div key={catKey} className="category-group">
                  <h3>{catLabel}</h3>
                  <div className="category-list">
                    {categories[catKey].map(level => {
                      const isCompleted = completedLevelIds.includes(level.id);
                      const isActive = currentLevelId === level.id;
                      
                      let diffClass = "diff-easy";
                      if (level.difficulty === "Medium") diffClass = "diff-medium";
                      if (level.difficulty === "Hard") diffClass = "diff-hard";

                      const levelTitle = lang === "zh" ? level.titleZh : level.titleEn;

                      return (
                        <div
                          key={level.id}
                          className={`level-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                          onClick={() => onSelectLevel(level.id)}
                        >
                          <div className="level-status-icon">
                            {isCompleted ? (
                              <CheckCircle className="icon-complete" size={16} />
                            ) : (
                              <div className="icon-pending"></div>
                            )}
                          </div>
                          <div className="level-item-info">
                            <h4>{levelTitle}</h4>
                            <span className={`difficulty-badge ${diffClass}`}>
                              {level.difficulty}
                            </span>
                          </div>
                          <ChevronRight className="chevron-icon" size={16} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cheat-section">
            {cheatSheetItems.map(cat => (
              <div key={cat.category} className="cheat-category">
                <h3>{cat.category}</h3>
                <div className="cheat-list">
                  {cat.commands.map(item => (
                    <div
                      key={item.cmd}
                      className="cheat-item"
                      title={lang === "en" ? "Click to insert into CLI terminal" : "点击自动填入终端"}
                      onClick={() => onCheatClick?.(item.cmd)}
                    >
                      <code>{item.cmd}</code>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
