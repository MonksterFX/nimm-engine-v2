export class TreeNode {
  readonly id: string;
  public parents: TreeNode[] = [];
  public childrens: TreeNode[] = [];
  public basePattern?: TreeNode = undefined;

  constructor(id: string) {
    this.id = id;
  }

  addParent(node: TreeNode): TreeNode {
    return this;
  }

  addChild(node: TreeNode): TreeNode {
    this.childrens.push(node);
    return this;
  }

  addBasePattern(node: TreeNode): TreeNode {
    if (this.basePattern) throw new Error('base pattern already set');
    this.basePattern = node;
    return this;
  }
}
