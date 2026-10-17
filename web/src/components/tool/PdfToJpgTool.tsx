import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';
import Dropzone from './Dropzone';
import AddFilesButton from './AddFilesButton';
import ToolWorkspace from './ToolWorkspace';
import { SelectChip, SettingsStrip } from './SettingChips';
import BusyDialog from './BusyDialog';
import ResultCard from './ResultCard';
import ErrorNotice from './ErrorNotice';
import { ArrowCircleIcon, GridIcon, QualityIcon } from './tile-icons';
import { bytesToUrl } from '@/lib/download';
import { holdUntil } from '@/lib/utils';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage/draft';
import { useDraftWipe } from '@/lib/storage/useDraftWipe';
import { useAutoDismiss } from '@/lib/useAutoDismiss';
import type { LoadedPdf, Thumb } from '@/lib/pdf/pdf-to-jpg';

const ACCEPT = 'application/pdf,.pdf';
const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

type Phase = 'idle' | 'loading' | 'working' | 'done';
type Quality = 'good' | 'high' | 'max';
const QUALITY: Record<Quality, number> = { good: 0.75, high: 0.92, max: 1 };

// Heavy code (pdf.js, zip) is loaded only when needed.
const loadEngine = () => import('@/lib/pdf/pdf-to-jpg');

interface SavedDraft {
  file: File;
  selected: number[];
  dpi: number;
  quality: Quality;
}

const Spinner = () => <span class="m-auto block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />;

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** One page: tap to select. Its preview is only drawn once the card scrolls into view. */
function PageCard(props: { n: number; thumb?: Thumb; selected: boolean; disabled: boolean; onToggle: (n: number) => void; onVisible: (n: number) => void }) {
  const { n, thumb, selected, disabled, onToggle, onVisible } = props;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      onVisible(n);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onVisible(n);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [n]);

  return (
    <li>
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Page ${n}`}
        disabled={disabled}
        onClick={() => onToggle(n)}
        class={`relative block w-full rounded-card p-2 text-left transition-[transform,background-color] duration-300 active:scale-[0.98] active:duration-75 ${
          selected ? 'bg-brand-soft ring-2 ring-brand' : 'bg-surface-2 hover:bg-border'
        }`}
      >
        <span
          class={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-ctl border-2 shadow ${
            selected ? 'border-brand bg-brand text-on-brand' : 'border-border bg-surface text-transparent'
          }`}
          aria-hidden="true"
        >
          <CheckIcon />
        </span>
        <span class="flex bg-surface shadow-sm ring-1 ring-border" style={{ aspectRatio: String(thumb?.aspect ?? 0.75) }}>
          {thumb ? <img src={thumb.url} alt="" draggable={false} class="pointer-events-none h-full w-full object-contain" /> : <Spinner />}
        </span>
        <span class="mt-2 block text-center text-xs font-medium">Page {n}</span>
      </button>
    </li>
  );
}

export default function PdfToJpgTool({ draftKey = 'pdf-to-jpg' }: { draftKey?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, Thumb>>({});
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState<Quality>('high');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number; filename: string; count: number; kind: 'jpg' | 'zip'; scaledDown: boolean } | null>(null);

  const pdf = useRef<LoadedPdf | null>(null);
  const engine = useRef<Awaited<ReturnType<typeof loadEngine>> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const asked = useRef<Set<number>>(new Set());
  const thumbsRef = useRef<Record<number, Thumb>>({});
  const generation = useRef(0); // bumps for every opened PDF so thumbnail jobs of an older PDF are dropped
  const draftReady = useRef(false);
  const onDownloaded = useDraftWipe(draftKey);
  // the "brought back" note fades away by itself
  useAutoDismiss(restored, () => setRestored(false));
  /** a restored draft must not be saved again straight away (that would restart its 15-minute clock) */
  const skipNextSave = useRef(false);
  thumbsRef.current = thumbs;

  const dropCurrent = () => {
    Object.values(thumbsRef.current).forEach((t) => URL.revokeObjectURL(t.url));
    void engine.current?.closePdf(pdf.current);
    pdf.current = null;
    asked.current = new Set();
    queue.current = Promise.resolve();
  };

  useEffect(
    () => () => {
      generation.current++;
      dropCurrent();
    },
    [],
  );

  /** Open a PDF (optionally with a remembered page selection). */
  const openFile = async (f: File, keep?: number[]) => {
    const my = ++generation.current;
    setError('');
    setPhase('loading');
    dropCurrent();
    setThumbs({});
    try {
      const eng = await loadEngine();
      engine.current = eng;
      const loaded = await eng.loadPdf(f);
      if (my !== generation.current) {
        await eng.closePdf(loaded);
        return;
      }
      pdf.current = loaded;
      setFile(f);
      setNumPages(loaded.numPages);
      const all = Array.from({ length: loaded.numPages }, (_, i) => i + 1);
      setSelected(keep ? keep.filter((n) => n >= 1 && n <= loaded.numPages) : all);
      setPhase('idle');
    } catch (e) {
      if (my !== generation.current) return;
      setFile(null);
      setNumPages(0);
      setSelected([]);
      setError(
        (e as { reason?: string }).reason === 'password'
          ? 'This PDF is password protected. Remove the password first, then try again.'
          : 'We could not read this PDF. It may be damaged. Try another file.',
      );
      setPhase('idle');
    }
  };

  const pick = (files: File[]) => {
    const f = files.find(isPdf);
    if (!f) {
      setError('Please choose a PDF file.');
      return;
    }
    setRestored(false);
    clearResult();
    void openFile(f);
  };

  /** Draw a page preview, one at a time (keeps the page responsive). */
  const requestThumb = (n: number) => {
    const p = pdf.current;
    const eng = engine.current;
    if (!p || !eng || asked.current.has(n)) return;
    asked.current.add(n);
    const my = generation.current;
    queue.current = queue.current.then(async () => {
      if (my !== generation.current) return;
      try {
        const t = await eng.renderThumb(p, n);
        if (my !== generation.current) {
          URL.revokeObjectURL(t.url);
          return;
        }
        setThumbs((prev) => ({ ...prev, [n]: t }));
      } catch {
        /* a page that cannot be previewed can still be converted */
      }
    });
  };

  const clearResult = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setPhase('idle');
  };

  const toggle = (n: number) => {
    setRestored(false);
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));
  };
  const selectAll = () => setSelected(Array.from({ length: numPages }, (_, i) => i + 1));
  const selectNone = () => setSelected([]);

  const reset = () => {
    generation.current++;
    dropCurrent();
    setThumbs({});
    setFile(null);
    setNumPages(0);
    setSelected([]);
    setError('');
    setRestored(false);
    setProgress(0);
    clearResult();
  };

  const convert = async () => {
    const p = pdf.current;
    if (!file || !p || selected.length === 0) return;
    setError('');
    setProgress(0);
    setPhase('working');
    const t0 = performance.now();
    try {
      const eng = engine.current ?? (await loadEngine());
      const out = await eng.exportPages(p, [...selected].sort((a, b) => a - b), {
        dpi,
        quality: QUALITY[quality],
        baseName: file.name.replace(/\.pdf$/i, '') || 'pdf',
        onProgress: setProgress,
      });
      await holdUntil(t0, 800);
      setResult({
        url: bytesToUrl(out.bytes, out.type),
        size: out.bytes.byteLength,
        filename: out.filename,
        count: out.count,
        kind: out.type === 'application/zip' ? 'zip' : 'jpg',
        scaledDown: out.scaledDown,
      });
      setPhase('done');
    } catch {
      setError('We could not convert these pages. Try fewer pages or a lower quality.');
      setPhase('idle');
    }
  };

  // ----- never lose the user's work on a refresh
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadDraft<SavedDraft>(draftKey);
      if (!alive) return;
      if (saved?.file) {
        // the PDF opens asynchronously: allow saving, but skip the one save caused by the restore itself
        skipNextSave.current = true;
        draftReady.current = true;
        setDpi(saved.dpi);
        setQuality(saved.quality);
        await openFile(saved.file, saved.selected);
        if (!pdf.current) skipNextSave.current = false; // could not be opened: nothing will be re-saved
        if (alive) setRestored(true);
      }
      draftReady.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  const draftSignature = file ? `${file.name}|${file.size}|${file.lastModified}|${selected.join(',')}|${dpi}|${quality}` : '';
  useEffect(() => {
    if (!draftReady.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      if (!file) void clearDraft(draftKey);
      else void saveDraft<SavedDraft>(draftKey, { file, selected, dpi, quality });
    }, 300);
    return () => clearTimeout(timer);
  }, [draftSignature]);

  const busy = phase === 'working';

  if (phase === 'done' && result) {
    return (
      <div class="mx-auto max-w-2xl">
        <ResultCard
          url={result.url}
          filename={result.filename}
          size={result.size}
          title={result.kind === 'zip' ? 'Success! Your images are ready' : 'Success! Your JPG is ready'}
          buttonLabel={result.kind === 'zip' ? 'Download ZIP' : 'Download JPG'}
          detail={`${result.count} ${result.count === 1 ? 'page' : 'pages'}`}
          note={result.scaledDown ? 'Very large pages were made a little smaller so your device could handle them.' : undefined}
          onReset={reset}
          resetLabel="Convert another PDF"
          onDownload={onDownloaded}
          afterDownload="For your privacy, your saved files are removed from this browser within a minute."
        />
      </div>
    );
  }

  // Empty state: one big, centered drop area
  if (!file) {
    return (
      <div class="mx-auto grid max-w-2xl gap-4">
        <Dropzone
          accept={ACCEPT}
          label="Choose PDF file"
          hint="One PDF file. Nothing is uploaded."
          onFiles={pick}
          onIntent={() => void loadEngine()}
        />
        {phase === 'loading' && (
          <p class="flex items-center justify-center gap-2 text-sm text-muted" role="status">
            <span class="block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
            Reading your PDF…
          </p>
        )}
        {error && <ErrorNotice message={error} />}
      </div>
    );
  }

  const count = selected.length;
  const summary = count === 0 ? 'Select at least one page.' : count === 1 ? 'You will get 1 JPG file.' : `You will get one ZIP with ${count} JPG files.`;

  return (
    <ToolWorkspace
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length) {
          e.preventDefault();
          pick(Array.from(e.dataTransfer.files));
        }
      }}
      main={
        <>
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <AddFilesButton accept={ACCEPT} label="Choose another PDF" onFiles={pick} onIntent={() => void loadEngine()} disabled={busy} />
            <span class="mr-auto ml-1 min-w-0 flex-1 truncate text-sm text-muted" title={file.name}>
              {file.name} · {numPages} {numPages === 1 ? 'page' : 'pages'}
            </span>
            <Button variant="secondary" size="sm" disabled={busy || count === numPages} onClick={selectAll}>
              Select all
            </Button>
            <Button variant="secondary" size="sm" disabled={busy || count === 0} onClick={selectNone}>
              Select none
            </Button>
          </div>

          {restored && (
            <div role="status" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-success-soft px-3 py-2 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white" aria-hidden="true">
                <CheckIcon />
              </span>
              <span>We brought back your PDF from your last visit. It is kept only in this browser, for 15 minutes after your last change.</span>
              <Button variant="link" size="sm" onClick={reset}>
                Start fresh
              </Button>
            </div>
          )}
          {error && <ErrorNotice message={error} />}

          {/* the conversion settings: right on top of the pages they apply to */}
          <div class="overflow-hidden rounded-ctl border border-border">
      <SettingsStrip embedded>
        <SelectChip
          legend="Resolution"
          icon={<GridIcon />}
          name="dpi"
          value={String(dpi)}
          onChange={(v) => setDpi(Number(v))}
          disabled={busy}
          options={[
            { value: '72', label: '72 DPI (small files)' },
            { value: '96', label: '96 DPI' },
            { value: '150', label: '150 DPI (recommended)' },
            { value: '200', label: '200 DPI' },
            { value: '300', label: '300 DPI (print)' },
          ]}
          hint="72: small files. 150: best for screens and sharing. 300: for printing."
        />
        <SelectChip
          legend="Image quality"
          icon={<QualityIcon />}
          name="quality"
          value={quality}
          onChange={setQuality}
          disabled={busy}
          options={[
            { value: 'good', label: 'Good (smaller)' },
            { value: 'high', label: 'High (recommended)' },
            { value: 'max', label: 'Maximum (largest)' },
          ]}
        />
      </SettingsStrip>
          </div>
<p class="text-xs text-muted sm:text-sm" role="status">
        {summary}
      </p>

          <div class="relative isolate max-h-[70vh] overflow-y-auto p-1" data-testid="page-scroll">
            <ul class="grid grid-cols-2 items-start gap-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:gap-4" aria-label="Pages of your PDF. Tap a page to select or deselect it.">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                <PageCard key={n} n={n} thumb={thumbs[n]} selected={selected.includes(n)} disabled={busy} onToggle={toggle} onVisible={requestThumb} />
              ))}
            </ul>
          </div>
          <p class="text-sm text-muted">
            Tap a page to select or deselect it. {count} of {numPages} selected.
          </p>
        </>
      }
      action={
        <Button size="cta" full onClick={convert} disabled={busy || count === 0} class="gap-3 font-bold">
            {count > 1 ? `Convert ${count} pages to JPG` : 'Convert to JPG'}
            <ArrowCircleIcon />
          </Button>
      }
      overlays={
        <>
        {busy && <BusyDialog title="Converting your pages…" progress={progress} note="Please wait. Your PDF stays on your device." />}
        </>
      }
    />
  );
}
