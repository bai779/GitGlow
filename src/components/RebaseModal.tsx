import React, { useState, useEffect } from "react";
import type { GitState, CommandResult } from "../logic/gitEngine";

interface RebaseModalProps {
  gitState: GitState;
  onResolve: (actions: { commitId: string; action: "pick" | "squash" | "drop" }[]) => void;
  onCancel: () => void;
  lang: "en" | "zh" | "ja" | "es";
}

export const RebaseModal: React.FC<RebaseModalProps> = ({ gitState, onResolve, onCancel, lang }) => {
  const [actions, setActions] = useState<{ commitId: string; action: "pick" | "squash" | "drop" }[]>([]);

  useEffect(() => {
    if (gitState.rebaseState) {
      const initialActions = gitState.rebaseState.commitsToRebase.map(id => ({
        commitId: id,
        action: "pick" as const
      }));
      setActions(initialActions);
    }
  }, [gitState.rebaseState]);

  if (!gitState.rebaseState) return null;

  const handleActionChange = (index: number, newAction: "pick" | "squash" | "drop") => {
    const newActions = [...actions];
    newActions[index].action = newAction;
    setActions(newActions);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newActions = [...actions];
    const temp = newActions[index];
    newActions[index] = newActions[index - 1];
    newActions[index - 1] = temp;
    setActions(newActions);
  };

  const moveDown = (index: number) => {
    if (index === actions.length - 1) return;
    const newActions = [...actions];
    const temp = newActions[index];
    newActions[index] = newActions[index + 1];
    newActions[index + 1] = temp;
    setActions(newActions);
  };

  const execute = () => {
    onResolve(actions);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="modal-glow-border" style={{ borderColor: '#b15cff' }}></div>
        <h2 style={{ color: '#b15cff', marginBottom: '8px' }}>
          {lang === 'zh' ? '交互式变基 (Interactive Rebase)' : 'Interactive Rebase'}
        </h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          {lang === 'zh' 
            ? `正在将分支重置到 ${gitState.rebaseState.targetBase}。调整下方的提交顺序或选择特定的合并动作：`
            : `Rebasing onto ${gitState.rebaseState.targetBase}. Reorder commits or choose specific actions:`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {actions.map((item, idx) => {
            const commit = gitState.commits[item.commitId];
            return (
              <div 
                key={item.commitId} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '8px 12px', 
                  borderRadius: '6px' 
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? '#555' : '#fff', cursor: 'pointer', padding: '0 4px' }}>▲</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === actions.length - 1} style={{ background: 'none', border: 'none', color: idx === actions.length - 1 ? '#555' : '#fff', cursor: 'pointer', padding: '0 4px' }}>▼</button>
                </div>
                
                <select 
                  value={item.action} 
                  onChange={(e) => handleActionChange(idx, e.target.value as any)}
                  style={{
                    background: '#1e293b',
                    color: item.action === 'drop' ? '#ff0844' : item.action === 'squash' ? '#f6d365' : '#00f2fe',
                    border: '1px solid #334155',
                    padding: '4px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <option value="pick">pick</option>
                  <option value="squash">squash</option>
                  <option value="drop">drop</option>
                </select>

                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#94a3b8' }}>
                  {item.commitId}
                </div>
                <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: item.action === 'drop' ? '#64748b' : '#e2e8f0', textDecoration: item.action === 'drop' ? 'line-through' : 'none' }}>
                  {commit?.message}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button 
            className="modal-btn primary-btn" 
            style={{ background: 'linear-gradient(135deg, #b15cff 0%, #00f2fe 100%)', boxShadow: '0 4px 15px rgba(177, 92, 255, 0.25)' }}
            onClick={execute}
          >
            {lang === 'zh' ? '执行 (Execute)' : 'Execute'}
          </button>
          <button 
            className="modal-btn secondary-btn" 
            onClick={onCancel}
          >
            {lang === 'zh' ? '中止变基 (Abort)' : 'Abort Rebase'}
          </button>
        </div>
      </div>
    </div>
  );
};
