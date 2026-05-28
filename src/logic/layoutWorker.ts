// layoutWorker.ts
// This worker offloads the heavy DFS/BFS traversal and coordinate layout
// calculations from the main UI thread to prevent blocking on large repositories.

export interface LayoutRequest {
  commits: Record<string, any>;
  branches: Record<string, string>;
}

export interface LayoutResult {
  nodes: Record<string, { x: number; y: number; color: string; branchName: string }>;
  maxDepth: number;
  lanesCount: number;
}

// Same hash function used in GitGraph
const BRANCH_COLORS: Record<string, string> = {
  main: "#00f2fe",
  master: "#00f2fe",
  bugFix: "#ff0844",
  dev: "#f6d365",
  feature: "#b15cff",
  detached: "#9aa0a6",
};

function getBranchColor(branchName: string): string {
  if (BRANCH_COLORS[branchName]) return BRANCH_COLORS[branchName];
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 85%, 60%)`;
}

self.onmessage = (e: MessageEvent<LayoutRequest>) => {
  const { commits, branches } = e.data;
  
  const depths: Record<string, number> = {};

  function getDepth(id: string): number {
    if (depths[id] !== undefined) return depths[id];
    const commit = commits[id];
    if (!commit || commit.parents.length === 0) {
      return depths[id] = 0;
    }
    const parentDepths = commit.parents.map((p: string) => getDepth(p));
    return depths[id] = Math.max(...parentDepths) + 1;
  }

  Object.keys(commits).forEach(getDepth);

  const branchNames = Object.keys(branches).sort((a, b) => {
    if (a === "main" || a === "master") return -1;
    if (b === "main" || b === "master") return 1;
    return a.localeCompare(b);
  });

  const laneMap: Record<string, number> = {};
  branchNames.forEach((name, idx) => {
    laneMap[name] = idx;
  });

  const nodeSpacingX = 110;
  const nodeSpacingY = 80;
  const paddingX = 80;
  const paddingY = 60;

  const nodes: Record<string, { x: number; y: number; color: string; branchName: string }> = {};

  Object.keys(commits).forEach(id => {
    const commit = commits[id];
    let branchName = commit.branch;
    
    let laneIndex = 0;
    if (laneMap[branchName] !== undefined) {
      laneIndex = laneMap[branchName];
    } else if (branchName === "detached") {
      laneIndex = branchNames.length;
    } else {
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
        laneIndex = 0;
      }
    }

    const x = paddingX + getDepth(id) * nodeSpacingX;
    const y = paddingY + laneIndex * nodeSpacingY;
    const color = getBranchColor(branchName);

    nodes[id] = { x, y, color, branchName };
  });

  const result: LayoutResult = {
    nodes,
    maxDepth: Math.max(...Object.values(depths), 0),
    lanesCount: branchNames.length + 1
  };

  self.postMessage(result);
};
