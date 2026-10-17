import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';
import AddFilesButton from './AddFilesButton';
import ToolWorkspace from './ToolWorkspace';
import PdfPageOptions from './PdfPageOptions';
import { SelectChip, SettingsStrip } from './SettingChips';
import { RichEditor, RichToolbar } from './RichEditor';
import ViewToggle from './ViewToggle';
import BusyDialog from './BusyDialog';
import ResultCard from './ResultCard';
import ErrorNotice from './ErrorNotice';
import Toast from './Toast';
import { ArrowCircleIcon, EyeIcon, FontSizeIcon, FontTextIcon, LineSpacingIcon, PencilIcon } from './tile-icons';
import { bytesToUrl } from '@/lib/download';
import { holdUntil } from '@/lib/utils';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage/draft';
import { useDraftWipe } from '@/lib/storage/useDraftWipe';
import { useAutoDismiss } from '@/lib/useAutoDismiss';
import { DEFAULT_TEXT_OPTIONS, type TextPdfOptions } from '@/lib/pdf/text-config';
import { markdownToHtml, textToHtml } from '@/lib/pdf/rich-html';
import type { LoadedPdf } from '@/lib/pdf/pdf-to-jpg';

const MAX_CHARS = 1_000_000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_ACCEPT = '.txt,.md,.markdown,.csv,.log,text/plain,text/markdown';

// Heavy code (pdf-lib, fonts, pdf.js for the preview) is loaded only when needed.
const loadBuilder = () => import('@/lib/pdf/text-to-pdf');
const loadRenderer = () => import('@/lib/pdf/pdf-to-jpg');

type Phase = 'edit' | 'working' | 'done';
type Tab = 'write' | 'preview';

interface SavedDraft {
  /** the editor's HTML (older drafts saved plain `text`) */
  html?: string;
  text?: string;
  opts: TextPdfOptions;
}

interface Preview {
  status: 'idle' | 'building' | 'ready' | 'error';
  pages: number;
  replaced: number;
}

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export default function TextToPdfTool({ draftKey = 'text-to-pdf' }: { draftKey?: string }) {
  const [html, setHtml] = useState('');
  const [plain, setPlain] = useState('');
  const [opts, setOpts] = useState<TextPdfOptions>(DEFAULT_TEXT_OPTIONS);
  const [tab, setTab] = useState<Tab>('write');
  const [phase, setPhase] = useState<Phase>('edit');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [toast, setToast] = useState('');
  const [result, setResult] = useState<{ url: string; size: number; pages: number; filename: string; replaced: number } | null>(null);
  const [pv, setPv] = useState<Preview>({ status: 'idle', pages: 0, replaced: 0 });
  const [pvPage, setPvPage] = useState(1);
  const [pvVersion, setPvVersion] = useState(0);
  const [pvImg, setPvImg] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const pvDoc = useRef<LoadedPdf | null>(null);
  const pvSeq = useRef(0);
  const pvImgUrl = useRef('');
  const draftReady = useRef(false);
  const onDownloaded = useDraftWipe(draftKey);
  // the "brought back" note fades away by itself
  useAutoDismiss(restored, () => setRestored(false));
  /** a restored draft must not be saved again straight away (that would restart its 15-minute clock) */
  const skipNextSave = useRef(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const patch = (p: Partial<TextPdfOptions>) => {
    setRestored(false);
    setOpts((o) => ({ ...o, ...p }));
  };

  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  const hasContent = plain.trim().length > 0;
  const options = opts; // title lives in opts

  const notify = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  };

  /** read the editor into state (word count, draft, preview) */
  const syncFromEditor = () => {
    const el = editorRef.current;
    if (!el) return;
    // the very first line must be a paragraph too (a bare text node would not take list/align/heading)
    if (el.firstChild?.nodeType === 3 && document.activeElement === el) document.execCommand('formatBlock', false, 'p');
    const t = el.innerText.replace(/ /g, ' ');
    el.classList.toggle('is-empty', !t.trim() && !el.querySelector('li,hr'));
    setRestored(false);
    setPlain(t);
    setHtml(el.innerHTML);
  };

  /** replace the whole content, or add to the end */
  const putHtml = (h: string, append = false) => {
    const el = editorRef.current;
    if (!el) return;
    if (append) el.insertAdjacentHTML('beforeend', h);
    else el.innerHTML = h || '<p><br></p>';
    syncFromEditor();
  };

  // ---------- file upload
  const addFile = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError('');
    if (f.size > MAX_FILE_BYTES) {
      setError('That file is too large. Please use a text file under 5 MB.');
      return;
    }
    const content = await f.text();
    if (content.includes('\u0000')) {
      setError('This does not look like a text file. Please choose a .txt file.');
      return;
    }
    setRestored(false);
    const isMd = /\.(md|markdown)$/i.test(f.name);
    const h = isMd ? markdownToHtml(content.slice(0, MAX_CHARS)) : textToHtml(content.slice(0, MAX_CHARS));
    if (!hasContent) {
      putHtml(h);
      notify(isMd ? `Loaded ${f.name} with its formatting` : `Loaded ${f.name}`);
    } else {
      putHtml(`<p><br></p>${h}`, true);
      notify(`Added ${f.name} at the end of your text`);
    }
  };

  const clearAll = () => {
    putHtml('');
    setOpts((o) => ({ ...o, title: '' }));
    setRestored(false);
    setError('');
  };

  // The editor is removed while the result is shown; when it comes back, put the text back in it.
  useEffect(() => {
    const el = editorRef.current;
    if (phase !== 'edit' || !el) return;
    const want = html || '<p><br></p>';
    if (el.innerHTML !== want) el.innerHTML = want;
    el.classList.toggle('is-empty', !plain.trim() && !el.querySelector('li,hr'));
  }, [phase]);

  // ---------- never lose the text on a refresh
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = '<p><br></p>';
      editorRef.current.classList.add('is-empty');
    }
    let alive = true;
    (async () => {
      const saved = await loadDraft<SavedDraft>(draftKey);
      if (!alive) return;
      const savedHtml = saved?.html ?? (saved?.text ? textToHtml(saved.text) : '');
      const savedPlain = savedHtml.replace(/<[^>]*>/g, '').trim();
      if (saved && (savedPlain || saved.opts?.title?.trim())) {
        skipNextSave.current = true;
        putHtml(savedHtml);
        setOpts({ ...DEFAULT_TEXT_OPTIONS, ...saved.opts });
        setRestored(true);
      }
      draftReady.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  const draftSignature = JSON.stringify(opts) + '|' + html.length + '|' + html.slice(0, 60) + html.slice(-60);
  useEffect(() => {
    if (!draftReady.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      if (!plain.trim() && !opts.title.trim() && JSON.stringify(opts) === JSON.stringify(DEFAULT_TEXT_OPTIONS)) void clearDraft(draftKey);
      else void saveDraft<SavedDraft>(draftKey, { html, opts });
    }, 400);
    return () => clearTimeout(timer);
  }, [draftSignature]);

  // ---------- live preview (the real PDF, drawn by pdf.js), only while the Preview tab is open
  const dropPreviewDoc = async () => {
    const eng = await loadRenderer();
    await eng.closePdf(pvDoc.current);
    pvDoc.current = null;
  };

  useEffect(() => {
    if (tab !== 'preview') return;
    const seq = ++pvSeq.current;
    if (!hasContent && !opts.title.trim()) {
      setPv({ status: 'idle', pages: 0, replaced: 0 });
      return;
    }
    setPv((p) => ({ ...p, status: 'building' }));
    const timer = window.setTimeout(async () => {
      try {
        const [{ buildTextPdf }, eng] = await Promise.all([loadBuilder(), loadRenderer()]);
        const out = await buildTextPdf(html, opts, 'html');
        if (seq !== pvSeq.current) return;
        const loaded = await eng.loadPdf(new File([out.bytes as BlobPart], 'preview.pdf', { type: 'application/pdf' }));
        if (seq !== pvSeq.current) {
          await eng.closePdf(loaded);
          return;
        }
        await eng.closePdf(pvDoc.current);
        pvDoc.current = loaded;
        setPv({ status: 'ready', pages: out.pageCount, replaced: out.replaced });
        setPvPage((p) => Math.min(p, out.pageCount));
        setPvVersion((v) => v + 1);
      } catch {
        if (seq === pvSeq.current) setPv({ status: 'error', pages: 0, replaced: 0 });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [tab, html, JSON.stringify(opts)]);

  // draw the page that is being looked at
  useEffect(() => {
    const doc = pvDoc.current;
    if (tab !== 'preview' || !doc || pv.status !== 'ready') return;
    let alive = true;
    (async () => {
      const eng = await loadRenderer();
      try {
        const t = await eng.renderThumb(doc, Math.min(pvPage, doc.numPages), 900);
        if (!alive) {
          URL.revokeObjectURL(t.url);
          return;
        }
        if (pvImgUrl.current) URL.revokeObjectURL(pvImgUrl.current);
        pvImgUrl.current = t.url;
        setPvImg(t.url);
      } catch {
        /* keep the previous image */
      }
    })();
    return () => {
      alive = false;
    };
  }, [pvVersion, pvPage, tab]);

  useEffect(
    () => () => {
      pvSeq.current++;
      clearTimeout(toastTimer.current);
      if (pvImgUrl.current) URL.revokeObjectURL(pvImgUrl.current);
      if (result) URL.revokeObjectURL(result.url);
      void dropPreviewDoc();
    },
    [],
  );

  // ---------- convert
  const convert = async () => {
    if (!hasContent) {
      setError('Please type or paste some text first.');
      return;
    }
    if (plain.length > MAX_CHARS) {
      setError('Your text is too long. Please keep it under 1,000,000 characters.');
      return;
    }
    setError('');
    setProgress(0.15);
    setPhase('working');
    const t0 = performance.now();
    try {
      const { buildTextPdf } = await loadBuilder();
      setProgress(0.5);
      const out = await buildTextPdf(html, options, 'html');
      setProgress(1);
      await holdUntil(t0, 800);
      setResult({
        url: bytesToUrl(out.bytes),
        size: out.bytes.byteLength,
        pages: out.pageCount,
        filename: `${slug(opts.title) || 'document'}.pdf`,
        replaced: out.replaced,
      });
      setPhase('done');
    } catch {
      setError('We could not create the PDF. Please try again.');
      setPhase('edit');
    }
  };

  /** a fresh, empty document (the editor is rebuilt empty when it comes back) */
  const startNew = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setHtml('');
    setPlain('');
    setOpts((o) => ({ ...o, title: '' }));
    setRestored(false);
    setError('');
    void clearDraft(draftKey);
    setPhase('edit');
  };

  const backToEditing = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setPhase('edit');
  };

  const busy = phase === 'working';

  if (phase === 'done' && result) {
    return (
      <div class="mx-auto max-w-2xl">
        <ResultCard
          url={result.url}
          filename={result.filename}
          size={result.size}
          detail={`${result.pages} ${result.pages === 1 ? 'page' : 'pages'}`}
          note={result.replaced > 0 ? `${result.replaced} character${result.replaced === 1 ? '' : 's'} that the fonts cannot draw (like emoji) became "?".` : undefined}
          onBack={backToEditing}
          backLabel="Edit your text again"
          onReset={startNew}
          resetLabel="Create another PDF"
          onDownload={onDownloaded}
          afterDownload="For your privacy, your saved files are removed from this browser within a minute."
        />
      </div>
    );
  }

  const fieldClass = 'min-h-11 w-full rounded-ctl border border-text/60 bg-surface px-3 text-base';

  /** the extra settings: the toolbar of the editor (Write tab) and of the preview (Preview tab) */
  const settingsStrip = (
      <SettingsStrip embedded>
        <RichToolbar elRef={editorRef} disabled={busy} onChange={syncFromEditor} />
        <SelectChip
          legend="Font"
          icon={<FontTextIcon />}
          name="font"
          value={opts.font}
          onChange={(v) => patch({ font: v })}
          disabled={busy}
          options={[
            { value: 'sans', label: 'Sans' },
            { value: 'serif', label: 'Serif' },
            { value: 'mono', label: 'Mono' },
          ]}
        />
        <SelectChip
          legend="Font size"
          icon={<FontSizeIcon />}
          name="fontSize"
          value={String(opts.fontSize)}
          onChange={(v) => patch({ fontSize: Number(v) })}
          disabled={busy}
          options={[9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map((n) => ({ value: String(n), label: `${n} pt` }))}
        />
        <SelectChip
          legend="Line spacing"
          icon={<LineSpacingIcon />}
          name="lineSpacing"
          value={String(opts.lineSpacing)}
          onChange={(v) => patch({ lineSpacing: Number(v) })}
          disabled={busy}
          options={[
            { value: '1.25', label: 'Compact' },
            { value: '1.5', label: 'Normal' },
            { value: '1.75', label: 'Relaxed' },
            { value: '2', label: 'Double' },
          ]}
        />
      </SettingsStrip>
  );

  return (
    <ToolWorkspace
      main={
        <>
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <ViewToggle
              legend="Write or preview"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'write', label: 'Write', icon: <PencilIcon /> },
                { value: 'preview', label: 'Preview', icon: <EyeIcon /> },
              ]}
            />
            <AddFilesButton accept={FILE_ACCEPT} label="Upload text file" onFiles={addFile} disabled={busy} />
            <span class="mr-auto ml-1 text-xs text-muted sm:text-sm">
              {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {plain.length.toLocaleString()} characters
            </span>
            <Button variant="secondary" size="sm" disabled={busy || (!hasContent && !opts.title)} onClick={clearAll}>
              Clear
            </Button>
          </div>

          {restored && (
            <div role="status" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-success-soft px-3 py-2 text-sm">
              <span>We brought back your text from your last visit. It is kept only in this browser, for 15 minutes after your last change.</span>
              <Button variant="link" size="sm" onClick={clearAll}>
                Start fresh
              </Button>
            </div>
          )}
          {error && <ErrorNotice message={error} />}

          {/* the editor stays mounted (hidden) on the Preview tab, so nothing typed is ever lost */}
          <div class={`grid gap-3 ${tab === 'write' ? '' : 'hidden'}`}>
            <label class="grid gap-1.5">
              <span class="text-sm font-semibold">
                Document title <span class="font-normal text-muted">(optional)</span>
              </span>
              <input type="text" class={fieldClass} maxLength={120} value={opts.title} placeholder="For example: Meeting notes" onInput={(e) => patch({ title: (e.target as HTMLInputElement).value })} />
            </label>
            <div class="grid gap-1.5">
              <span class="text-sm font-semibold">Your text</span>
              {/* one card: formatting + font toolbar on top, the editor below */}
              <div class="overflow-hidden rounded-ctl border border-text/60 bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[var(--focus)]">
                {settingsStrip}
                <RichEditor elRef={editorRef} font={opts.font} fontSize={opts.fontSize} lineSpacing={opts.lineSpacing} disabled={busy} onInput={syncFromEditor} />
              </div>
            </div>
          </div>
          {tab === 'preview' && (
            <div class="grid gap-3">
              <div class="overflow-hidden rounded-ctl border border-border">{settingsStrip}</div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm text-muted" role="status">
                  {pv.status === 'building' && 'Updating preview…'}
                  {pv.status === 'ready' && `Page ${Math.min(pvPage, pv.pages)} of ${pv.pages}`}
                  {pv.status === 'idle' && 'Nothing to preview yet'}
                  {pv.status === 'error' && 'Could not build the preview'}
                </span>
                <div class="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={pv.status !== 'ready' || pvPage <= 1} onClick={() => setPvPage((p) => Math.max(1, p - 1))}>
                    ← Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={pv.status !== 'ready' || pvPage >= pv.pages} onClick={() => setPvPage((p) => Math.min(pv.pages, p + 1))}>
                    Next →
                  </Button>
                </div>
              </div>
              <div class="relative isolate max-h-[75vh] min-h-[320px] overflow-auto rounded-card bg-surface-2 p-3 sm:p-5" data-testid="preview-box">
                {pv.status === 'idle' && <p class="py-16 text-center text-sm text-muted">Type or paste some text on the Write tab, then come back to see how the PDF will look.</p>}
                {pv.status === 'error' && <p class="py-16 text-center text-sm text-danger">Something went wrong while drawing the preview. Try again.</p>}
                {pvImg && pv.status !== 'idle' && pv.status !== 'error' && (
                  <img src={pvImg} alt={`Preview of page ${pvPage}`} class={`mx-auto h-auto w-full max-w-[720px] bg-white shadow-md ring-1 ring-border transition-opacity ${pv.status === 'building' ? 'opacity-60' : ''}`} />
                )}
                {pv.status === 'building' && !pvImg && (
                  <div class="flex justify-center py-16">
                    <span class="block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand" aria-hidden="true" />
                  </div>
                )}
              </div>
              {pv.replaced > 0 && <p class="text-xs text-muted">{pv.replaced} character(s) that the fonts cannot draw (like emoji) will show as "?".</p>}
            </div>
          )}
        </>
      }
      optionsTitle="PDF page options"
      options={
        <>
          <PdfPageOptions
            idPrefix="text"
            pageSize={opts.pageSize}
            onPageSize={(v) => patch({ pageSize: v === 'fit' ? 'a4' : v })}
            orientation={opts.orientation}
            onOrientation={(v) => patch({ orientation: v })}
            margin={opts.margin}
            onMargin={(v) => patch({ margin: v })}
            pageNumbers={opts.pageNumbers}
            onPageNumbers={(v) => patch({ pageNumbers: v })}
            disabled={busy}
          />
        </>
      }
      action={
        <Button size="cta" full onClick={convert} disabled={busy} class="gap-3 font-bold">
            Convert to PDF
            <ArrowCircleIcon />
          </Button>
      }
      overlays={
        <>
        {toast && <Toast kind="done" text={toast} />}
        {busy && <BusyDialog title="Creating your PDF…" progress={progress} note="Please wait. Your text stays on your device." />}
        </>
      }
    />
  );
}
