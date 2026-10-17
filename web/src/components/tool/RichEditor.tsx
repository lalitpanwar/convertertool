import type { RefObject } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { SelectChip, ToolButton, ToolGroup } from './SettingChips';
import { AlignIcon, ClearFormatIcon, ListBulletIcon, ListNumberIcon } from './tile-icons';
import { textToHtml } from '@/lib/pdf/rich-html';
import type { Family } from '@/lib/pdf/text-config';

/** CSS pixels for a PDF point, so the editor text is the same size relative to the page as in the PDF */
const PX_PER_PT = 4 / 3;
const FAMILY_CSS: Record<Family, string> = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Devanagari', sans-serif",
  serif: "Georgia, 'Times New Roman', 'Noto Serif', 'Noto Serif Devanagari', serif",
  mono: "ui-monospace, 'Cascadia Mono', Consolas, 'Noto Sans Mono', monospace",
};

interface EditorProps {
  elRef: RefObject<HTMLDivElement | null>;
  font: Family;
  fontSize: number;
  lineSpacing: number;
  disabled?: boolean;
  /** hidden (but kept alive, with its undo history) while the Preview tab is shown */
  hidden?: boolean;
  onInput: () => void;
}

/**
 * The writing area: a contenteditable that shows bold, headings, lists... right away, using the chosen
 * font, size and line spacing. It is uncontrolled (the parent sets content through the element).
 */
export function RichEditor({ elRef, font, fontSize, lineSpacing, disabled, hidden, onInput }: EditorProps) {
  useEffect(() => {
    // Enter makes a new <p> (not a <div>) so the PDF gets clean paragraphs
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      /* ignore */
    }
  }, []);

  const onPaste = (e: ClipboardEvent) => {
    // paste as plain text: pasted web pages and Word files would bring in unwanted styles
    e.preventDefault();
    const t = e.clipboardData?.getData('text/plain') ?? '';
    if (t) document.execCommand('insertHTML', false, textToHtml(t));
  };

  return (
    <div
      ref={elRef}
      class={`rich relative block h-[48vh] min-h-[300px] w-full resize-y overflow-auto p-3 focus:outline-none ${hidden ? 'hidden' : ''}`}
      style={{ fontFamily: FAMILY_CSS[font], fontSize: `${fontSize * PX_PER_PT}px`, lineHeight: lineSpacing }}
      contentEditable={!disabled}
      role="textbox"
      aria-multiline="true"
      aria-label="Your text"
      data-placeholder="Type or paste your text here. Hindi and other languages work too."
      data-testid="rich-editor"
      spellcheck
      onInput={onInput}
      onPaste={onPaste}
    />
  );
}

type Block = 'p' | 'h1' | 'h2' | 'h3' | 'blockquote';

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  block: Block;
  align: 'left' | 'center' | 'right' | 'justify';
}
const IDLE: ToolbarState = { bold: false, italic: false, underline: false, strike: false, ul: false, ol: false, block: 'p', align: 'left' };

const q = (c: string) => {
  try {
    return document.queryCommandState(c);
  } catch {
    return false;
  }
};

function readState(): ToolbarState {
  let block = '';
  try {
    block = String(document.queryCommandValue('formatBlock')).toLowerCase();
  } catch {
    /* ignore */
  }
  return {
    bold: q('bold'),
    italic: q('italic'),
    underline: q('underline'),
    strike: q('strikeThrough'),
    ul: q('insertUnorderedList'),
    ol: q('insertOrderedList'),
    block: (['h1', 'h2', 'h3', 'blockquote'].includes(block) ? block : 'p') as Block,
    align: q('justifyCenter') ? 'center' : q('justifyRight') ? 'right' : q('justifyFull') ? 'justify' : 'left',
  };
}

/** Formatting buttons for the editor: pressed state follows the cursor; each tap applies at once. */
export function RichToolbar({ elRef, disabled, onChange }: { elRef: RefObject<HTMLDivElement | null>; disabled?: boolean; onChange: () => void }) {
  const [st, setSt] = useState<ToolbarState>(IDLE);

  useEffect(() => {
    const refresh = () => {
      const el = elRef.current;
      const sel = window.getSelection();
      if (el && sel && sel.rangeCount && el.contains(sel.anchorNode)) setSt(readState());
    };
    document.addEventListener('selectionchange', refresh);
    return () => document.removeEventListener('selectionchange', refresh);
  }, []);

  const run = (cmd: string, arg?: string) => {
    const el = elRef.current;
    if (!el || disabled) return;
    el.focus();
    document.execCommand(cmd, false, arg);
    setSt(readState());
    onChange();
  };

  const setBlock = (b: Block) => run('formatBlock', b === 'blockquote' ? 'blockquote' : b);

  return (
    <>
      <ToolGroup label="Text style">
        <ToolButton label="Bold" active={st.bold} disabled={disabled} onPress={() => run('bold')}>
          <span class="font-bold">B</span>
        </ToolButton>
        <ToolButton label="Italic" active={st.italic} disabled={disabled} onPress={() => run('italic')}>
          <span class="font-serif italic">I</span>
        </ToolButton>
        <ToolButton label="Underline" active={st.underline} disabled={disabled} onPress={() => run('underline')}>
          <span class="underline">U</span>
        </ToolButton>
        <ToolButton label="Strikethrough" active={st.strike} disabled={disabled} onPress={() => run('strikeThrough')}>
          <span class="line-through">S</span>
        </ToolButton>
      </ToolGroup>

      <SelectChip
        legend="Paragraph style"
        icon={<span class="text-xs font-bold leading-none">H</span>}
        name="block"
        value={st.block}
        onChange={(v) => setBlock(v as Block)}
        disabled={disabled}
        options={[
          { value: 'p', label: 'Normal' },
          { value: 'h1', label: 'Heading 1' },
          { value: 'h2', label: 'Heading 2' },
          { value: 'h3', label: 'Heading 3' },
          { value: 'blockquote', label: 'Quote' },
        ]}
      />

      <ToolGroup label="Lists">
        <ToolButton label="Bullet list" active={st.ul} disabled={disabled} onPress={() => run('insertUnorderedList')}>
          <ListBulletIcon />
        </ToolButton>
        <ToolButton label="Numbered list" active={st.ol} disabled={disabled} onPress={() => run('insertOrderedList')}>
          <ListNumberIcon />
        </ToolButton>
      </ToolGroup>

      <ToolGroup label="Alignment">
        {(
          [
            ['left', 'justifyLeft', 'Align left'],
            ['center', 'justifyCenter', 'Align center'],
            ['right', 'justifyRight', 'Align right'],
            ['justify', 'justifyFull', 'Justify'],
          ] as const
        ).map(([w, cmd, label]) => (
          <ToolButton key={w} label={label} active={st.align === w} disabled={disabled} onPress={() => run(cmd)}>
            <AlignIcon which={w} />
          </ToolButton>
        ))}
      </ToolGroup>

      <ToolGroup label="Clear">
        <ToolButton
          label="Clear formatting"
          disabled={disabled}
          onPress={() => {
            run('removeFormat');
            run('formatBlock', 'p');
          }}
        >
          <ClearFormatIcon />
        </ToolButton>
      </ToolGroup>
    </>
  );
}
