import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';
import Dropzone from './Dropzone';
import AddFilesButton from './AddFilesButton';
import ToolWorkspace from './ToolWorkspace';
import PageGrid, { type PageLook, type ViewMode } from './PageGrid';
import ViewToggle from './ViewToggle';
import Toast from './Toast';
import DuplicateDialog from './DuplicateDialog';
import type { Item } from './item';
import { ArrowCircleIcon, GridIcon, ListIcon } from './tile-icons';
import BusyDialog from './BusyDialog';
import ResultCard from './ResultCard';
import ErrorNotice from './ErrorNotice';
import { holdUntil, moveItem, sortByName, uid } from '@/lib/utils';
import { bytesToUrl } from '@/lib/download';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage/draft';
import { useDraftWipe } from '@/lib/storage/useDraftWipe';
import { useAutoDismiss } from '@/lib/useAutoDismiss';

type Phase = 'idle' | 'working' | 'done';
type Problem = 'password' | 'invalid';

// Heavy code is loaded only when needed: pdf-lib to merge, pdf.js to draw the first-page previews.
const loadEngine = () => import('@/lib/pdf/merge');
const loadRenderer = () => import('@/lib/pdf/pdf-to-jpg');

interface SavedDraft {
  items: { id: string; file: File }[];
}

const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
const keyOf = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

/** Phones start in List view (easier to move files around); the choice is remembered. */
const initialView = (): ViewMode => {
  try {
    const saved = localStorage.getItem('pdf-merge-view');
    if (saved === 'grid' || saved === 'list') return saved;
    return window.matchMedia('(max-width: 639px)').matches ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const problemText = (name: string, reason: Problem) =>
  reason === 'password' ? `"${name}" is password protected. Remove the password first, then add it again.` : `"${name}" could not be read. Remove it and try again.`;

const summary = (list: { name: string; reason: Problem }[]) =>
  list.length === 1
    ? problemText(list[0].name, list[0].reason)
    : `${list.length} files cannot be merged (they are marked in red): ${list.map((p) => `"${p.name}"`).join(', ')}. Remove them to continue.`;

export default function MergePdfTool({ draftKey = 'merge-pdf' }: { draftKey?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<ViewMode>(initialView);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(0);
  const [bad, setBad] = useState<Record<string, Problem>>({});
  const [dups, setDups] = useState<File[]>([]);
  const [flash, setFlash] = useState<{ ids: string[]; kind: 'added' | 'moved'; token: number } | null>(null);
  const [toast, setToast] = useState<{ kind: 'adding' | 'done'; text: string } | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; pages: number } | null>(null);

  const draftReady = useRef(false);
  const onDownloaded = useDraftWipe(draftKey);
  useAutoDismiss(restored > 0, () => setRestored(0));
  /** a restored draft must not be saved again straight away (that would restart its 15-minute clock) */
  const skipNextSave = useRef(false);
  const flashTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);
  /** previews are drawn one at a time (pdf.js on a phone with many big PDFs would run out of memory) */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const alive = useRef(true);

  const showFlash = (ids: string[], kind: 'added' | 'moved') => {
    setFlash({ ids, kind, token: Date.now() });
    clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 3000);
  };

  const notify = (kind: 'adding' | 'done', text: string, hideAfterMs?: number) => {
    setToast({ kind, text });
    clearTimeout(toastTimer.current);
    if (hideAfterMs) toastTimer.current = window.setTimeout(() => setToast(null), hideAfterMs);
  };

  /** Read a PDF: first-page preview, page count, or why it cannot be merged. */
  const makePreview = (it: Item) => {
    const run = async () => {
      if (!alive.current) return;
      const eng = await loadRenderer();
      let pdf: Awaited<ReturnType<typeof eng.loadPdf>> | null = null;
      try {
        pdf = await eng.loadPdf(it.file);
        const t = await eng.renderThumb(pdf, 1, 280);
        const pages = pdf.numPages;
        setItems((prev) => {
          if (!prev.some((p) => p.id === it.id)) {
            URL.revokeObjectURL(t.url); // removed before the preview was ready
            return prev;
          }
          return prev.map((p) => (p.id === it.id ? { ...p, preview: t.url, w: t.aspect * 100, h: 100, pages } : p));
        });
      } catch (e) {
        const reason: Problem = (e as { reason?: string })?.reason === 'password' ? 'password' : 'invalid';
        setBad((b) => ({ ...b, [it.id]: reason }));
        setError((cur) => cur || problemText(it.file.name, reason));
      } finally {
        await eng.closePdf(pdf);
      }
    };
    const next = queue.current.then(run, run);
    queue.current = next;
    return next;
  };

  useEffect(
    () => () => {
      alive.current = false;
      clearTimeout(flashTimer.current);
      clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  // Bring back the files after a refresh, and save changes as they happen
  useEffect(() => {
    let live = true;
    (async () => {
      const saved = await loadDraft<SavedDraft>(draftKey);
      if (!live) return;
      if (saved?.items?.length) {
        skipNextSave.current = true;
        const list: Item[] = saved.items.map((s) => ({ id: s.id, file: s.file }));
        setItems(list);
        setRestored(list.length);
        list.forEach((it) => void makePreview(it));
      }
      draftReady.current = true;
    })();
    return () => {
      live = false;
    };
  }, []);

  const draftSignature = items.map((i) => i.id).join(',');
  useEffect(() => {
    if (!draftReady.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      if (items.length === 0) void clearDraft(draftKey);
      else void saveDraft<SavedDraft>(draftKey, { items: items.map((i) => ({ id: i.id, file: i.file })) });
    }, 300);
    return () => clearTimeout(timer);
  }, [draftSignature]);

  const clearResult = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setPhase('idle');
  };

  const append = async (files: File[]) => {
    const fresh: Item[] = files.map((file) => ({ id: uid(), file }));
    const label = fresh.length === 1 ? 'PDF' : 'PDFs';
    setItems((prev) => [...prev, ...fresh]);
    notify('adding', `Adding ${fresh.length} ${label}…`);
    await Promise.all(fresh.map(makePreview));
    if (!alive.current) return;
    showFlash(
      fresh.map((f) => f.id),
      'added',
    );
    notify('done', `${fresh.length} ${label} added`, 3200);
  };

  const addFiles = (files: File[]) => {
    const good = files.filter(isPdf);
    setError(good.length < files.length ? 'Some files were skipped. Please choose PDF files.' : '');
    if (good.length === 0) return;
    setRestored(0);
    const seen = new Set(items.map((i) => keyOf(i.file)));
    const unique: File[] = [];
    const dupes: File[] = [];
    good.forEach((f) => {
      const k = keyOf(f);
      if (seen.has(k)) dupes.push(f);
      else {
        seen.add(k);
        unique.push(f);
      }
    });
    if (unique.length) void append(unique);
    if (dupes.length) setDups((prev) => [...prev, ...dupes]);
    if (result) clearResult();
  };

  const keepDuplicate = () => {
    const [file, ...rest] = dups;
    if (file) void append([file]);
    setDups(rest);
  };
  const dropDuplicate = () => setDups((prev) => prev.slice(1));

  const reorder = (from: number, to: number) => {
    const it = items[from];
    if (!it || from === to) return;
    setRestored(0);
    setItems((prev) => moveItem(prev, from, to));
    showFlash([it.id], 'moved');
    notify('done', `Moved ${it.file.name} to position ${to + 1}`, 3200);
  };

  const remove = (id: string) => {
    setError(''); // removing data clears any error
    setBad((b) => {
      const { [id]: _gone, ...rest } = b;
      return rest;
    });
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const reset = () => {
    items.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    setItems([]);
    setBad({});
    setRestored(0);
    setFlash(null);
    setToast(null);
    setError('');
    setProgress(0);
    clearResult();
  };

  const changeView = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem('pdf-merge-view', v);
    } catch {
      /* private mode: the choice just is not remembered */
    }
  };

  const reading = items.some((i) => !i.preview && !bad[i.id]);
  const totalPages = items.reduce((n, i) => n + (i.pages ?? 0), 0);

  const merge = async () => {
    const known = items.filter((i) => bad[i.id]);
    if (known.length) {
      setError(summary(known.map((i) => ({ name: i.file.name, reason: bad[i.id] }))));
      return;
    }
    setError('');
    setProgress(0);
    setPhase('working');
    const t0 = performance.now();
    try {
      const { mergePdfs, MergeError } = await loadEngine();
      try {
        const { bytes, pages } = await mergePdfs(
          items.map((i) => i.file),
          { onProgress: setProgress },
        );
        await holdUntil(t0, 800);
        setResult({ url: bytesToUrl(bytes), size: bytes.byteLength, pages });
        setPhase('done');
      } catch (e) {
        if (e instanceof MergeError) {
          const hit = items.find((i) => i.file.name === e.fileName);
          if (hit) setBad((b) => ({ ...b, [hit.id]: e.reason === 'encrypted' ? 'password' : 'invalid' }));
          setError(problemText(e.fileName, e.reason === 'encrypted' ? 'password' : 'invalid'));
        } else {
          setError('Something went wrong while merging. Please try again.');
        }
        setPhase('idle');
      }
    } catch {
      setError('Could not load the merge engine. Check your connection and try again.');
      setPhase('idle');
    }
  };

  const busy = phase === 'working';

  /** every PDF card shows its first page, white page shape, no margin */
  const look = (it: Item): PageLook => ({ aspect: it.w && it.h ? it.w / it.h : 0.707, padPct: 0 });

  if (phase === 'done' && result) {
    return (
      <div class="mx-auto max-w-2xl">
        <ResultCard
          url={result.url}
          filename="merged.pdf"
          size={result.size}
          detail={`${items.length} PDFs combined · ${result.pages} ${result.pages === 1 ? 'page' : 'pages'}`}
          onReset={reset}
          resetLabel="Merge more PDFs"
          onDownload={onDownloaded}
          afterDownload="For your privacy, your saved files are removed from this browser within a minute."
        />
      </div>
    );
  }

  // Empty state: one big, centered drop area
  if (items.length === 0) {
    return (
      <div class="mx-auto grid max-w-2xl gap-4">
        <Dropzone
          accept="application/pdf,.pdf"
          multiple
          label="Choose PDF files"
          hint="Select two or more PDFs. Nothing is uploaded."
          onFiles={addFiles}
          onIntent={() => {
            void loadEngine();
            void loadRenderer();
          }}
        />
        {error && <ErrorNotice message={error} />}
      </div>
    );
  }

  return (
    <ToolWorkspace
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length) {
          e.preventDefault();
          addFiles(Array.from(e.dataTransfer.files));
        }
      }}
      main={
        <>
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <AddFilesButton accept="application/pdf,.pdf" multiple label="Add more PDFs" onFiles={addFiles} disabled={busy} />
            <span class="mr-auto ml-1 text-sm text-muted">
              {items.length} {items.length === 1 ? 'PDF' : 'PDFs'}
              {totalPages > 0 && ` · ${totalPages} pages`}
            </span>
            <ViewToggle
              legend="View"
              value={view}
              onChange={changeView}
              options={[
                { value: 'grid', label: 'Thumbnails', icon: <GridIcon /> },
                { value: 'list', label: 'List', icon: <ListIcon /> },
              ]}
            />
            {items.length > 1 && (
              <>
                <span class="text-xs text-muted sm:text-sm">
                  <span class="sm:hidden">Sort:</span>
                  <span class="hidden sm:inline">Sort by name:</span>
                </span>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => setItems((p) => sortByName(p, 'asc'))}>
                  A → Z
                </Button>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => setItems((p) => sortByName(p, 'desc'))}>
                  Z → A
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" disabled={busy} onClick={reset}>
              Remove all
            </Button>
          </div>

          {restored > 0 && (
            <div role="status" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-success-soft px-3 py-2 text-sm">
              <span>
                We brought back your {restored} {restored === 1 ? 'file' : 'files'} from your last visit. They are kept only in this browser, for 15 minutes after your last change.
              </span>
              <Button variant="link" size="sm" onClick={reset}>
                Start fresh
              </Button>
            </div>
          )}

          {error && <ErrorNotice message={error} />}

          <PageGrid items={items} look={look} noun="PDFs" onReorder={reorder} onRemove={remove} view={view} flash={flash} bad={bad} disabled={busy} />
          <p class="text-sm text-muted">
            The final PDF follows this order, first to last. Drag a PDF to change the order (on a phone, press and hold it first), or tap its number to move it to any position.
          </p>
          {items.length < 2 && <p class="text-sm font-medium text-text">Add at least one more PDF to merge.</p>}
        </>
      }
      action={
        <Button size="cta" full onClick={merge} disabled={items.length < 2 || busy || reading} class="gap-3 font-bold">
          {reading ? 'Reading your PDFs…' : 'Merge PDF'}
          {!reading && <ArrowCircleIcon />}
        </Button>
      }
      overlays={
        <>
          {dups.length > 0 && <DuplicateDialog file={dups[0]} more={dups.length - 1} onKeep={keepDuplicate} onDelete={dropDuplicate} />}
          {toast && <Toast kind={toast.kind} text={toast.text} />}
          {busy && <BusyDialog title="Merging your PDFs…" progress={progress} note="Please wait. Your files stay on your device." />}
        </>
      }
    />
  );
}
