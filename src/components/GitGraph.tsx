import React, { useEffect, useRef, useState } from "react";
import type { GitState } from "../logic/gitEngine";
import type { LayoutResult } from "../logic/layoutWorker";

interface GitGraphProps {
  state: GitState;
  onNodeClick?: (commitId: string) => void;
}

const BRANCH_COLORS: Record<string, string> = {
  main: "#00f2fe",      // neon cyan
  master: "#00f2fe",
  bugFix: "#ff0844",    // neon pink
  dev: "#f6d365",       // gold
  feature: "#b15cff",   // violet
  detached: "#9aa0a6",  // cool gray
};

export function getBranchColor(branchName: string): string {
  if (BRANCH_COLORS[branchName]) return BRANCH_COLORS[branchName];
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 85%, 60%)`;
}

export const GitGraph: React.FC<GitGraphProps> = ({ state, onNodeClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [layout, setLayout] = useState<LayoutResult | null>(null);

  // 1. Offload layout calculation to Web Worker (Initialize once)
  useEffect(() => {
    workerRef.current = new Worker(new URL("../logic/layoutWorker.ts", import.meta.url), { type: "module" });
    
    workerRef.current.onmessage = (e) => {
      setLayout(e.data);
    };
    
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Send state to worker when commits or branches change
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        commits: state.commits,
        branches: state.branches
      });
    }
  }, [state.commits, state.branches]);

  // 2. Draw Graph on Canvas
  useEffect(() => {
    if (!layout || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate dimensions
    const width = Math.max(layout.maxDepth * 110 + 260, 600);
    const height = Math.max(layout.lanesCount * 80 + 100, 320);

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Resolve pointers
    const refsByCommit: Record<string, Array<{ type: string; name: string; active: boolean }>> = {};
    Object.keys(state.commits).forEach(id => refsByCommit[id] = []);
    let activeBranchName = "";
    let headTargetCommit = state.head;
    
    if (state.head.startsWith("ref: refs/heads/")) {
      activeBranchName = state.head.substring(16);
      headTargetCommit = state.branches[activeBranchName];
    } else {
      headTargetCommit = state.head;
    }
    
    Object.entries(state.branches).forEach(([name, cid]) => {
      if (refsByCommit[cid]) {
        refsByCommit[cid].push({ type: "branch", name, active: name === activeBranchName });
      }
    });
    Object.entries(state.tags).forEach(([name, cid]) => {
      if (refsByCommit[cid]) {
        refsByCommit[cid].push({ type: "tag", name, active: false });
      }
    });
    if (!activeBranchName && refsByCommit[headTargetCommit]) {
      refsByCommit[headTargetCommit].push({ type: "head", name: "HEAD", active: true });
    }

    // --- Draw Connections (Bezier Curves) ---
    ctx.lineWidth = 3;
    Object.entries(state.commits).forEach(([id, commit]) => {
      const childNode = layout.nodes[id];
      if (!childNode) return;
      
      commit.parents.forEach((parentId) => {
        const parentNode = layout.nodes[parentId];
        if (!parentNode) return;
        
        ctx.beginPath();
        ctx.moveTo(parentNode.x, parentNode.y);
        ctx.bezierCurveTo(
          parentNode.x + 50, parentNode.y, 
          childNode.x - 50, childNode.y, 
          childNode.x, childNode.y
        );
        
        ctx.strokeStyle = childNode.color;
        ctx.globalAlpha = 0.55;
        ctx.shadowColor = childNode.color;
        ctx.shadowBlur = 4;
        
        ctx.stroke();
        
        // Reset properties
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });
    });

    // --- Draw Nodes ---
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    Object.entries(layout.nodes).forEach(([id, node]) => {
      const isHead = id === headTargetCommit;
      
      // Draw Active HEAD Pulse
      if (isHead) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      }

      // Draw Main Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#0b0f19";
      ctx.fill();
      
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 6;
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Commit ID Label
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(id, node.x, node.y + 1);

      // Draw Pointers (Branches, Tags, HEAD)
      const refs = refsByCommit[id] || [];
      if (refs.length > 0) {
        ctx.font = "10px JetBrains Mono, monospace";
        
        let labelOffsetX = 25;
        refs.forEach((ref) => {
          let bgColor = "rgba(15, 23, 42, 0.85)";
          let borderColor = "#94a3b8";
          let textColor = "#f1f5f9";
          let labelText = ref.name;

          if (ref.type === "branch") {
            const bColor = getBranchColor(ref.name);
            borderColor = bColor;
            
            if (ref.active) {
              bgColor = "rgba(0, 242, 254, 0.25)"; // Simplified active fill
              textColor = "#ffffff";
              labelText = `* ${ref.name}`;
            }
          } else if (ref.type === "tag") {
            borderColor = "#eab308";
            textColor = "#fef08a";
            bgColor = "rgba(113, 63, 18, 0.4)";
          } else if (ref.type === "head") {
            borderColor = "#c084fc";
            textColor = "#f3e8ff";
            bgColor = "rgba(88, 28, 135, 0.4)";
          }

          const labelWidth = ctx.measureText(labelText).width + 16;
          const rectX = node.x + labelOffsetX;
          const rectY = node.y - 10;
          
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, labelWidth, 20, 5);
          ctx.fill();
          
          if (ref.active) {
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = 4;
          }
          
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          ctx.fillStyle = textColor;
          // Check if font loading needed to switch weight, native canvas doesn't easily swap weight
          // We handle it via string prefix for now
          ctx.fillText(labelText, rectX + labelWidth / 2, rectY + 10);
          
          labelOffsetX += labelWidth + 8; // spacing between labels
        });
      }
    });
  }, [layout, state.head, state.branches, state.tags]);

  // 3. Canvas Hit Testing for Clicks
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layout || !onNodeClick || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * scaleX / dpr;
    const y = (e.clientY - rect.top) * scaleY / dpr;

    for (const [id, node] of Object.entries(layout.nodes)) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= 16 * 16) {
        onNodeClick(id);
        break;
      }
    }
  };

  return (
    <div className="git-graph-container" ref={containerRef} style={{ overflow: "auto" }}>
      <canvas 
        ref={canvasRef} 
        onClick={handleClick}
        style={{ cursor: onNodeClick ? "pointer" : "default", display: "block" }} 
      />
    </div>
  );
};
