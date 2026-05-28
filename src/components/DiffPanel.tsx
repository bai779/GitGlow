import React, { useMemo } from "react";
import type { GitState } from "../logic/gitEngine";
import { X } from "lucide-react";

interface DiffPanelProps {
  commitId: string;
  gitState: GitState;
  onClose: () => void;
}

// Very basic line-based diff algorithm for demonstration
function computeDiff(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const diff: { type: 'added' | 'removed' | 'unchanged', text: string }[] = [];
  
  // A simplistic approach: find common prefix and suffix, the rest is different
  // For a real app, we'd use jsdiff, but here we simulate it for our index.html appends
  
  let i = 0;
  while (i < oldLines.length || i < newLines.length) {
    if (oldLines[i] === newLines[i]) {
      diff.push({ type: 'unchanged', text: oldLines[i] });
    } else {
      if (i < oldLines.length) {
        diff.push({ type: 'removed', text: oldLines[i] });
      }
      if (i < newLines.length) {
        diff.push({ type: 'added', text: newLines[i] });
      }
    }
    i++;
  }
  
  return diff;
}

export const DiffPanel: React.FC<DiffPanelProps> = ({ commitId, gitState, onClose }) => {
  const commit = gitState.commits[commitId];
  
  const diffs = useMemo(() => {
    if (!commit) return [];
    
    let parentText = "";
    if (commit.parents.length > 0) {
      const parentId = commit.parents[0];
      const parentCommit = gitState.commits[parentId];
      parentText = parentCommit?.files?.["index.html"] || "";
    }
    
    const currentText = commit.files?.["index.html"] || "";
    return computeDiff(parentText, currentText);
  }, [commit, gitState.commits]);

  if (!commit) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        backgroundColor: '#0f172a',
        borderLeft: '1px solid #334155',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '16px' }}>Commit: {commitId}</h3>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>{commit.message}</p>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>
      
      <div style={{ padding: '16px', flex: 1, overflowY: 'auto', backgroundColor: '#1e293b' }}>
        <div style={{ marginBottom: '8px', color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>📄 index.html</div>
        
        <div style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '12px',
          backgroundColor: '#0b0f19',
          borderRadius: '6px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          {diffs.map((line, idx) => {
            let bgColor = 'transparent';
            let color = '#e2e8f0';
            let prefix = ' ';
            
            if (line.type === 'added') {
              bgColor = 'rgba(34, 197, 94, 0.15)';
              color = '#4ade80';
              prefix = '+';
            } else if (line.type === 'removed') {
              bgColor = 'rgba(239, 68, 68, 0.15)';
              color = '#f87171';
              prefix = '-';
            }
            
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                backgroundColor: bgColor, 
                color,
                padding: '2px 8px',
                borderLeft: line.type === 'added' ? '2px solid #22c55e' : line.type === 'removed' ? '2px solid #ef4444' : '2px solid transparent'
              }}>
                <span style={{ width: '20px', userSelect: 'none', opacity: 0.5 }}>{prefix}</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{line.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
