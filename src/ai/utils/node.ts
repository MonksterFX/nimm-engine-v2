export class TreeNode<T> {
  readonly id: string;
  protected parents: T[] = [];
  protected childrens: T[] = [];
  protected basePattern?: T = undefined;

  constructor(id: string) {
    this.id = id;
  }

  getParents(): T[] {
    return this.parents;
  }

  getChildrens(): T[] {
    return this.childrens;
  }

  getBasePattern(): T | undefined {
    return this.basePattern;
  }

  addParent(node: T): TreeNode<T> {
    this.parents.push(node);
    return this;
  }

  addChild(node: T): TreeNode<T> {
    this.childrens.push(node);
    return this;
  }

  addChildrens(nodes: T[]): TreeNode<T> {
    this.childrens.push(...nodes);
    return this;
  }

  addBasePattern(node: T): TreeNode<T> {
    if (this.basePattern) throw new Error('base pattern already set');
    this.basePattern = node;
    return this;
  }
}
