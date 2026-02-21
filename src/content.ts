import {convertJapaneseNumeralToNumber} from './converter';

// Tags to exclude from translation
const EXCLUDED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'CODE',
  'PRE',
]);

function shouldProcessNode(node: Node): boolean {
  if (node.nodeType !== Node.TEXT_NODE) return false;
  const parent = node.parentElement;
  if (!parent) return false;
  if (EXCLUDED_TAGS.has(parent.tagName)) return false;
  if (parent.isContentEditable) return false;
  return true;
}

const processedNodes = new WeakSet<Node>();

function processNode(node: Node) {
  if (!shouldProcessNode(node) || processedNodes.has(node)) return;

  const text = node.textContent;
  if (!text) return;

  if (
    /[〇一二三四五六七八九十百千万億兆]/.test(text) ||
    text.includes('箇月')
  ) {
    const newText = convertJapaneseNumeralToNumber(text);
    if (newText !== text) {
      node.textContent = newText;
      // Mark as processed to avoid re-processing this exact node until it changes again
      // Actually, if we change the text, characterData mutation will fire.
      // But since we include Arabic numerals now, the test above will fail next time.
      processedNodes.add(node);
    }
  }
}

function walkAndConvert(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    processNode(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      return shouldProcessNode(node) && !processedNodes.has(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    processNode(node);
  }
}

// Initial conversion
walkAndConvert(document.body);

// Observe changes with debounce/batching if needed, but for now just optimize the handlers
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => walkAndConvert(node));
    } else if (mutation.type === 'characterData') {
      // If text content changed, we might need to re-process
      processedNodes.delete(mutation.target);
      processNode(mutation.target);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});
