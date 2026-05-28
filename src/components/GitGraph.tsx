import React, { useMemo } from "react";
import type { GitState } from "../logic/gitEngine";

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
  // Generate stable color based on string hash
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 85%, 60%)`;
}

export const GitGraph: React.FC<GitGraphProps> = ({ state, onNodeClick }) => {
  const { commits, branches, tags, head } = state;

  // Calculate layout coordinates
  const layout = useMemo(() => {
    const depths: Record<string, number> = {};

    // 1. Recursive depth calculator (generation from root C0)
    function getDepth(id: string): number {
      if (depths[id] !== undefined) return depths[id];
      const commit = commits[id];
      if (!commit || commit.parents.length === 0) {
        return depths[id] = 0;
      }
      const parentDepths = commit.parents.map(p => getDepth(p));
      return depths[id] = Math.max(...parentDepths) + 1;
    }

    // Initialize all depths
    Object.keys(commits).forEach(getDepth);

    // 2. Determine active branch names and assign horizontal lanes (Y-axis)
    const branchNames = Object.keys(branches).sort((a, b) => {
      if (a === "main" || a === "master") return -1;
      if (b === "main" || b === "master") return 1;
      return a.localeCompare(b);
    });

    // Make sure we have a lane for "detached" and other custom branch tags
    const laneMap: Record<string, number> = {};
    branchNames.forEach((name, idx) => {
      laneMap[name] = idx;
    });

    const nodeSpacingX = 110;
    const nodeSpacingY = 80;
    const paddingX = 80;
    const paddingY = 60;

    const nodes: Record<string, { x: number; y: number; color: string }> = {};

    // Determine the primary branch for commits (for lane assignment)
    // For merges, they belong to the current branch checked out during merge
    Object.keys(commits).forEach(id => {
      const commit = commits[id];
      let branchName = commit.branch;
      
      // Resolve lane index using parents search if branch name is deleted
      let laneIndex = 0;
      if (laneMap[branchName] !== undefined) {
        laneIndex = laneMap[branchName];
      } else if (branchName === "detached") {
        laneIndex = branchNames.length; // place at the bottom lane
      } else {
        // Deleted branch fallback: find first ancestor that has a valid branch lane
        const queue = [...commit.parents];
        const visited = new Set<string>();
        let foundLane = false;
        
        while (queue.length > 0) {
          const currId = queue.shift()!;
          if (visited.has(currId)) continue;
          visited.add(currId);
          
          const currCommit = commits[currId];
          if (currCommit) {
            if (laneMap[currCommit.branch] !== undefined) {
              laneIndex = laneMap[currCommit.branch];
              foundLane = true;
              break;
            }
            queue.push(...currCommit.parents);
          }
        }
        if (!foundLane) {
          laneIndex = 0; // Absolute fallback
        }
      }

      const x = paddingX + getDepth(id) * nodeSpacingX;
      const y = paddingY + laneIndex * nodeSpacingY;
      const color = getBranchColor(branchName);

      nodes[id] = { x, y, color };
    });

    return { nodes, maxDepth: Math.max(...Object.values(depths), 0), lanesCount: branchNames.length + 1 };
  }, [commits, branches]);

  const { nodes, maxDepth, lanesCount } = layout;

  // Resolve pointers
  const refsByCommit: Record<string, Array<{ type: "branch" | "tag" | "head"; name: string; active: boolean }>> = {};

  // Initialize arrays
  Object.keys(commits).forEach(id => {
    refsByCommit[id] = [];
  });

  // Check where HEAD points
  let headTargetCommit = "";
  let activeBranchName = "";

  if (head.startsWith("ref: refs/heads/")) {
    activeBranchName = head.substring("ref: refs/heads/".length);
    headTargetCommit = branches[activeBranchName];
  } else {
    headTargetCommit = head;
  }

  // Populate branches
  Object.entries(branches).forEach(([name, commitId]) => {
    if (refsByCommit[commitId]) {
      const isActive = activeBranchName === name;
      refsByCommit[commitId].push({ type: "branch", name, active: isActive });
    }
  });

  // Populate tags
  Object.entries(tags).forEach(([name, commitId]) => {
    if (refsByCommit[commitId]) {
      refsByCommit[commitId].push({ type: "tag", name, active: false });
    }
  });

  // Populate detached HEAD
  if (!activeBranchName && refsByCommit[headTargetCommit]) {
    refsByCommit[headTargetCommit].push({ type: "head", name: "HEAD", active: true });
  }

  // Draw connectors (Bezier curves)
  const paths = useMemo(() => {
    const list: React.ReactElement[] = [];
    Object.entries(commits).forEach(([id, commit]) => {
      const childNode = nodes[id];
      if (!childNode) return;

      commit.parents.forEach((parentId, pIdx) => {
        const parentNode = nodes[parentId];
        if (!parentNode) return;

        // Smooth Bezier path
        // Draw S-curve from parent (left) to child (right)
        const x1 = parentNode.x;
        const y1 = parentNode.y;
        const x2 = childNode.x;
        const y2 = childNode.y;

        const cp1x = x1 + 50;
        const cp1y = y1;
        const cp2x = x2 - 50;
        const cp2y = y2;

        const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

        // Connectors styled by the child's branch color
        const color = childNode.color;

        list.push(
          <path
            key={`${parentId}-${id}-${pIdx}`}
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeOpacity="0.55"
            className="graph-connection-line"
            style={{
              filter: `drop-shadow(0 0 2px ${color})`,
            }}
          />
        );
      });
    });
    return list;
  }, [commits, nodes]);

  const svgWidth = Math.max(maxDepth * 110 + 260, 600);
  const svgHeight = Math.max(lanesCount * 80 + 100, 320);

  return (
    <div className="git-graph-container">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMinYMin meet">
        <defs>
          <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connections */}
        <g>{paths}</g>

        {/* Nodes and Labels */}
        <g>
          {Object.entries(commits).map(([id, commit]) => {
            const node = nodes[id];
            if (!node) return null;

            const isHead = headTargetCommit === id;
            const nodeRefs = refsByCommit[id] || [];

            return (
              <g
                key={id}
                transform={`translate(${node.x}, ${node.y})`}
                className="graph-node-group"
                onClick={() => onNodeClick?.(id)}
                style={{ cursor: "pointer" }}
              >
                {/* Glowing ring for active HEAD node */}
                {isHead && (
                  <circle
                    r="24"
                    fill="url(#glow-grad)"
                    stroke={node.color}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="head-pulse-glow"
                    style={{
                      opacity: 0.8,
                    }}
                  />
                )}

                {/* Main commit circle */}
                <circle
                  r="16"
                  className="commit-node-circle"
                  fill="#0b0f19"
                  stroke={node.color}
                  strokeWidth="3.5"
                  style={{
                    filter: `drop-shadow(0 0 6px ${node.color})`,
                  }}
                />

                {/* Commit ID Label inside node */}
                <text
                  dy=".3em"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, Fira Code, monospace"
                  style={{ userSelect: "none" }}
                >
                  {id}
                </text>

                {/* Commit Message Tooltip (hover trigger) */}
                <title>{`[${id}] ${commit.message}`}</title>

                {/* Reference Pointers stacked to the right */}
                {nodeRefs.length > 0 && (
                  <g transform="translate(25, -2)">
                    {nodeRefs.map((ref, idx) => {
                      // Determine background color and text formatting
                      let bgColor = "rgba(15, 23, 42, 0.85)";
                      let borderColor = "#94a3b8";
                      let textColor = "#f1f5f9";
                      let labelText = ref.name;

                      if (ref.type === "branch") {
                        const bColor = getBranchColor(ref.name);
                        borderColor = bColor;
                        bgColor = ref.active ? `rgba(${hexToRgb(bColor)}, 0.25)` : "rgba(15, 23, 42, 0.85)";
                        textColor = ref.active ? "#ffffff" : "#cbd5e1";
                        if (ref.active) {
                          labelText = `* ${ref.name}`;
                        }
                      } else if (ref.type === "tag") {
                        borderColor = "#eab308"; // gold yellow
                        textColor = "#fef08a";
                        bgColor = "rgba(113, 63, 18, 0.4)";
                      } else if (ref.type === "head") {
                        borderColor = "#c084fc"; // purple
                        textColor = "#f3e8ff";
                        bgColor = "rgba(88, 28, 135, 0.4)";
                      }

                      // Horizontal spacing for multiple tags
                      const offsetOffsetX = idx * 80;

                      return (
                        <g key={`${ref.name}-${ref.type}`} transform={`translate(${offsetOffsetX}, -10)`}>
                          {/* Label Pill background */}
                          <rect
                            x="0"
                            y="0"
                            width={ref.name.length * 7 + 22}
                            height="20"
                            rx="5"
                            fill={bgColor}
                            stroke={borderColor}
                            strokeWidth="1.5"
                            style={{
                              filter: ref.active ? `drop-shadow(0 0 3px ${borderColor})` : "none"
                            }}
                          />
                          {/* Label Text */}
                          <text
                            x={(ref.name.length * 7 + 22) / 2}
                            y="13"
                            textAnchor="middle"
                            fill={textColor}
                            fontSize="10"
                            fontWeight={ref.active ? "bold" : "normal"}
                            fontFamily="JetBrains Mono, Fira Code, monospace"
                          >
                            {labelText}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// Helper for converting hex color to rgb values (for transparency support)
function hexToRgb(hex: string): string {
  // Simple check
  if (hex.startsWith("hsl")) {
    return "0, 242, 254"; // fallback cyan
  }
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}
