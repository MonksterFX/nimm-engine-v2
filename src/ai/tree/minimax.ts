// https://www.youtube.com/watch?v=l-hh51ncgDI

import { TreeNode } from './tree';

function evaluate(state: any, aiMove: boolean): number {
  const pointFactor = aiMove ? -1 : 1;
  // calculate situation
  // winning 1000 Points
  // losing -1000 Points
  return 1;
}

function minimax(node: TreeNode, depth: number, aiMove: boolean): number {
  // let nodeValue = aiMove ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  let nodeValue = 0;
  const evalFunction = aiMove ? Math.min : Math.max;

  if (depth === 0 || node.isLeaf) {
    let value = evaluate(node.state, aiMove);
    node.value = value;
  }

  for (const child of node.children) {
    let childValue = minimax(child, depth - 1, !aiMove);
    child.value = childValue;
    nodeValue = evalFunction(nodeValue, childValue);
  }

  node.value = nodeValue;

  return node.value;
}
