import { convertJapaneseNumeralToNumber } from './converter';

// Tags to exclude from translation
const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);

function shouldProcessNode(node: Node): boolean {
  if (node.nodeType !== Node.TEXT_NODE) return false;
  const parent = node.parentElement;
  if (!parent) return false;
  if (EXCLUDED_TAGS.has(parent.tagName)) return false;
  if (parent.isContentEditable) return false;
  return true;
}

function processNode(node: Node) {
  if (!shouldProcessNode(node)) return;

  const text = node.textContent;
  if (!text) return;

  // Check if text contains any Japanese numerals or "箇月" before trying to convert
  if (/[〇一二三四五六七八九十百千万億兆]/.test(text) || text.includes('箇月')) {
    const newText = convertJapaneseNumeralToNumber(text);
    if (newText !== text) {
      node.textContent = newText;
    }
  }
}

function walkAndConvert(root: Node) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return shouldProcessNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodesToProcess: Node[] = [];
  while (walker.nextNode()) {
    nodesToProcess.push(walker.currentNode);
  }

  nodesToProcess.forEach(processNode);
}

// Initial conversion
walkAndConvert(document.body);

// Observe changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // If a new element is added, walk its subtree
      walkAndConvert(node);
    });

    if (mutation.type === 'characterData') {
      processNode(mutation.target);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});
