import React, { useState } from "react";
import type { GitLevel } from "../data/levels";
import { Award, BookOpen, ChevronRight, HelpCircle, CheckCircle } from "lucide-react";

interface SidebarProps {
  levels: GitLevel[];
  currentLevelId: number | null; // null represents Sandbox
  completedLevelIds: number[];
  onSelectLevel: (levelId: number | null) => void;
  onCheatClick?: (cmdText: string) => void;
}

const CHEAT_SHEET_ITEMS = [
  {
    category: "Basics",
    commands: [
      { cmd: "git commit -m 'message'", desc: "Saves a snapshot of current project files" },
      { cmd: "git branch <name>", desc: "Creates a new branch pointer" },
      { cmd: "git checkout <ref>", desc: "Switches HEAD to specified branch/commit" },
      { cmd: "git checkout -b <name>", desc: "Creates a new branch and switches to it" }
    ]
  },
  {
    category: "Branching",
    commands: [
      { cmd: "git merge <branch>", desc: "Combines histories; creates a 3-way merge commit" },
      { cmd: "git rebase <branch>", desc: "Copies current branch's commits on top of target" }
    ]
  },
  {
    category: "Advanced",
    commands: [
      { cmd: "git cherry-pick <cid>", desc: "Copies specific commit onto active HEAD" },
      { cmd: "git reset --hard <cid>", desc: "Moves branch pointer back; discards local changes" },
      { cmd: "git tag <tag-name>", desc: "Adds a static bookmark to current commit" },
      { cmd: "git log", desc: "Displays list of historical commits" },
      { cmd: "git status", desc: "Displays branch state and changes" }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  levels,
  currentLevelId,
  completedLevelIds,
  onSelectLevel,
  onCheatClick
}) => {
  const [activeTab, setActiveTab] = useState<"levels" | "cheat">("levels");

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
        <h2>GitGlow</h2>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === "levels" ? "active" : ""}`}
          onClick={() => setActiveTab("levels")}
        >
          <BookOpen size={16} />
          <span>Challenges</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "cheat" ? "active" : ""}`}
          onClick={() => setActiveTab("cheat")}
        >
          <HelpCircle size={16} />
          <span>Cheat Sheet</span>
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
                <h4>🛝 Free Sandbox Mode</h4>
                <p>Practice git commands with zero restrictions</p>
              </div>
              <ChevronRight size={18} />
            </div>

            {/* Level Categories */}
            {(Object.keys(categories) as Array<keyof typeof categories>).map(catName => (
              <div key={catName} className="category-group">
                <h3>{catName}</h3>
                <div className="category-list">
                  {categories[catName].map(level => {
                    const isCompleted = completedLevelIds.includes(level.id);
                    const isActive = currentLevelId === level.id;
                    
                    let diffClass = "diff-easy";
                    if (level.difficulty === "Medium") diffClass = "diff-medium";
                    if (level.difficulty === "Hard") diffClass = "diff-hard";

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
                          <h4>{level.title}</h4>
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
            ))}
          </div>
        ) : (
          <div className="cheat-section">
            {CHEAT_SHEET_ITEMS.map(cat => (
              <div key={cat.category} className="cheat-category">
                <h3>{cat.category}</h3>
                <div className="cheat-list">
                  {cat.commands.map(item => (
                    <div
                      key={item.cmd}
                      className="cheat-item"
                      title="Click to insert into CLI terminal"
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
