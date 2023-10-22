import * as vscode from 'vscode';

type FoldingRangeNode = vscode.FoldingRange & {
  level: number;
  children: Record<number, FoldingRangeNode>;
};

const foldingRangeToTree = (
  ranges: vscode.FoldingRange[],
  root: Record<number, FoldingRangeNode> = {},
  opt?: {
    fromIdx: number;
    endLine: number;
    level: number;
  }
) => {
  for (let i = opt?.fromIdx ?? 0; i < ranges.length; i += 1) {
    const r = ranges[i];
    if (opt?.endLine !== undefined && r.start >= opt.endLine) {
      return {
        root,
        endIdx: i,
      };
    }

    const node = {
      ...r,
      level: (opt?.level ?? 0) + 1,
      children: {},
    };
    root[r.start] = node;
    const { endIdx } = foldingRangeToTree(ranges, node.children, {
      fromIdx: i + 1,
      level: node.level,
      endLine: node.end,
    });
    i = endIdx - 1;
  }

  return {
    root,
    endIdx: ranges.length,
  };
};
const flattenNodes = (tree: Record<string, FoldingRangeNode>) => {
  return Object.keys(tree).reduce((acc, n) => {
    acc.push(tree[n], ...flattenNodes(tree[n].children));
    return acc;
  }, [] as FoldingRangeNode[]);
};

const getCurrentLevelFoldingRange = (
  foldingRanges: vscode.FoldingRange[],
  currentLine: number
) => {
  const tree = foldingRangeToTree(foldingRanges);
  const nodes = flattenNodes(tree.root).reverse();
  const currentNode = nodes.find((n) => n.start <= currentLine);
  const currentLevel = currentNode?.level;
  return nodes.filter((n) => n.level === currentLevel);
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('refold.foldCurrentLevel', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor?.document) {
        return;
      }

      const foldingRanges: vscode.FoldingRange[] =
        await vscode.commands.executeCommand(
          'vscode.executeFoldingRangeProvider',
          editor?.document.uri
        );
      const currentLine = editor.selection.active.line;
      const currentRanges = getCurrentLevelFoldingRange(
        foldingRanges,
        currentLine
      );
      if (currentRanges.length) {
        vscode.commands.executeCommand('editor.fold', {
          levels: 1,
          selectionLines: currentRanges.map((n) => n.start),
        });
      }
    }),
    vscode.commands.registerCommand('refold.unfoldCurrentLevel', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor?.document) {
        return;
      }

      const foldingRanges: vscode.FoldingRange[] =
        await vscode.commands.executeCommand(
          'vscode.executeFoldingRangeProvider',
          editor?.document.uri
        );
      const currentLine = editor.selection.active.line;
      const currentRanges = getCurrentLevelFoldingRange(
        foldingRanges,
        currentLine
      );
      if (currentRanges.length) {
        vscode.commands.executeCommand('editor.unfold', {
          levels: 1,
          selectionLines: currentRanges.map((n) => n.start),
        });
      }
    })
  );
}

export function deactivate() {}
