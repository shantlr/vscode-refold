/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const foldingRangeToTree = (ranges, root = {}, opt) => {
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
const flattenNodes = (tree) => {
    return Object.keys(tree).reduce((acc, n) => {
        acc.push(tree[n], ...flattenNodes(tree[n].children));
        return acc;
    }, []);
};
const getCurrentLevelFoldingRange = (foldingRanges, currentLine) => {
    const tree = foldingRangeToTree(foldingRanges);
    const nodes = flattenNodes(tree.root).reverse();
    const currentNode = nodes.find((n) => n.start <= currentLine);
    const currentLevel = currentNode?.level;
    return nodes.filter((n) => n.level === currentLevel);
};
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('refold.foldCurrentLevel', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor?.document) {
            return;
        }
        const foldingRanges = await vscode.commands.executeCommand('vscode.executeFoldingRangeProvider', editor?.document.uri);
        const currentLine = editor.selection.active.line;
        const currentRanges = getCurrentLevelFoldingRange(foldingRanges, currentLine);
        if (currentRanges.length) {
            vscode.commands.executeCommand('editor.fold', {
                levels: 1,
                selectionLines: currentRanges.map((n) => n.start),
            });
        }
    }), vscode.commands.registerCommand('refold.unfoldCurrentLevel', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor?.document) {
            return;
        }
        const foldingRanges = await vscode.commands.executeCommand('vscode.executeFoldingRangeProvider', editor?.document.uri);
        const currentLine = editor.selection.active.line;
        const currentRanges = getCurrentLevelFoldingRange(foldingRanges, currentLine);
        if (currentRanges.length) {
            vscode.commands.executeCommand('editor.unfold', {
                levels: 1,
                selectionLines: currentRanges.map((n) => n.start),
            });
        }
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map