import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import githubLight from '@shikijs/themes/github-light';
import githubDark from '@shikijs/themes/github-dark';
import tsx from '@shikijs/langs/tsx';
import ts from '@shikijs/langs/typescript';
import bash from '@shikijs/langs/bash';

/**
 * Shiki is the syntax highlighter; it runs once, before React renders.
 * The JavaScript regex engine keeps the build self-contained — no extra
 * .wasm file is fetched, so `dist/` has zero external requests.
 *
 * Both themes are baked into one pass: every token carries a light and a dark
 * colour as CSS variables, and the `.dark` class picks one. No re-highlighting
 * when the theme toggles.
 */
let highlighter: HighlighterCore | undefined;

export async function initHighlighter() {
  highlighter = await createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [tsx, ts, bash],
    engine: createJavaScriptRegexEngine(),
  });
}

export function highlight(code: string, lang: 'tsx' | 'ts' | 'bash') {
  if (!highlighter) throw new Error('highlight() called before initHighlighter()');
  return highlighter.codeToHtml(code.replace(/\r\n/g, '\n').trimEnd(), {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });
}
