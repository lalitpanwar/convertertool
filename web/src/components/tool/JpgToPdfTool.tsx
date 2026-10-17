import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';
import Dropzone from './Dropzone';
import AddFilesButton from './AddFilesButton';
import ToolWorkspace from './ToolWorkspace';
import PdfPageOptions from './PdfPageOptions';
import PageGrid, { type PageLook, type ViewMode } from './PageGrid';
import ViewToggle from './ViewToggle';
import Toast from './Toast';
import DuplicateDialog from './DuplicateDialog';
import type { Item } from './item';
import { ArrowCircleIcon, RotateIcon, GridIcon, ListIcon } from './tile-icons';
import BusyDialog from './BusyDialog';
import ResultCard from './ResultCard';
import ErrorNotice from './ErrorNotice';
import { holdUntil, moveItem, sortByName, uid } from '@/lib/utils';
import { bytesToUrl } from '@/lib/download';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage/draft';
import { useDraftWipe } from '@/lib/storage/useDraftWipe';
import { useAutoDismiss } from '@/lib/useAutoDismiss';
import { makeThumb, type Rotation } from '@/lib/image/thumb';
import { ImageError, describeImageProblem, type ImageProblem } from '@/lib/image/decode';
import { pageGeometry, type Margin, type Orientation, type PageSize } from '@/lib/pdf/page-config';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const OK_TYPES = ACCEPT.split(',');

type Phase = 'idle' | 'working' | 'done';

// Heavy code (pdf-lib) is loaded only when needed.
const loadEngine = () => import('@/lib/pdf/jpg-to-pdf');

/** One clear sentence for one or several unreadable images. */
const problemSummary = (list: { name: string; reason: ImageProblem }[]) =>
  list.length === 1
    ? describeImageProblem(list[0].name, list[0].reason)
    : `${list.length} files could not be opened (they are marked in red): ${list.map((p) => `"${p.name}"`).join(', ')}. Remove them to continue.`;

/** Same name + size + modified time = the same file picked twice. */
/** Phones start in List view (easier to drag); the choice is remembered. */
const initialView = (): ViewMode => {
  try {
    const saved = localStorage.getItem('pdf-photo-view');
    if (saved === 'grid' || saved === 'list') return saved;
    return window.matchMedia('(max-width: 639px)').matches ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const keyOf = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

/** What we keep in the browser so a refresh does not lose the user's work. */
interface SavedDraft {
  items: { id: string; file: File; rotation: Rotation }[];
  pageSize: PageSize;
  orientation: Orientation;
  margin: Margin;
}

export default function JpgToPdfTool({ noun = 'photos', draftKey = 'jpg-to-pdf' }: { noun?: string; draftKey?: string }) {
  const single = noun.endsWith('s') ? noun.slice(0, -1) : noun; // photos -> photo
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [margin, setMargin] = useState<Margin>('none');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<ViewMode>(initialView);
  const [error, setError] = useState('');
  /** how many files were brought back from the saved draft (shows the "Restored" note) */
  const [restored, setRestored] = useState(0);
  /** false until we have tried to restore: stops an empty list from overwriting the saved draft */
  const draftReady = useRef(false);
  const onDownloaded = useDraftWipe(draftKey);
  // the "brought back" note fades away by itself
  useAutoDismiss(restored > 0, () => setRestored(0));
  /** a restored draft must not be saved again straight away (that would restart its 15-minute clock) */
  const skipNextSave = useRef(false);
  /** cards to highlight for a moment (just added / just moved) */
  const [flash, setFlash] = useState<{ ids: string[]; kind: 'added' | 'moved'; token: number } | null>(null);
  /** floating message: adding... / done */
  const [toast, setToast] = useState<{ kind: 'adding' | 'done'; text: string } | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);
  /** files that look like duplicates, waiting for the user's decision */
  const [dups, setDups] = useState<File[]>([]);
  /** images the browser cannot open: id -> why. They get a red mark and block Convert until removed. */
  const [bad, setBad] = useState<Record<string, ImageProblem>>({});
  const [result, setResult] = useState<{ url: string; size: number; pages: number } | null>(null);

  /** Put saved files back (same ids, order and rotation) and rebuild their previews. */
  const restoreDraft = (saved: SavedDraft) => {
    skipNextSave.current = true;
    const list: Item[] = saved.items.map((s) => ({ id: s.id, file: s.file, rotation: s.rotation }));
    setPageSize(saved.pageSize);
    setOrientation(saved.orientation);
    setMargin(saved.margin);
    setItems(list);
    setRestored(list.length);
    list.forEach(async (it) => {
      const thumb = await makeThumb(it.file, it.rotation ?? 0);
      if (thumb.failed) setBad((b) => ({ ...b, [it.id]: thumb.failed! }));
      setItems((prev) => {
        if (!prev.some((p) => p.id === it.id)) {
          URL.revokeObjectURL(thumb.url);
          return prev;
        }
        return prev.map((p) => (p.id === it.id ? { ...p, preview: thumb.url, w: thumb.w, h: thumb.h } : p));
      });
    });
  };

  // Bring back the files after a refresh
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadDraft<SavedDraft>(draftKey);
      if (!alive) return;
      if (saved?.items?.length) restoreDraft(saved);
      draftReady.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Save whenever the list (order, rotation) or the options change
  const draftSignature = items.map((i) => `${i.id}:${i.rotation ?? 0}`).join(',') + `|${pageSize}|${orientation}|${margin}`;
  useEffect(() => {
    if (!draftReady.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      if (items.length === 0) void clearDraft(draftKey);
      else
        void saveDraft<SavedDraft>(draftKey, {
          items: items.map((i) => ({ id: i.id, file: i.file, rotation: (i.rotation ?? 0) as Rotation })),
          pageSize,
          orientation,
          margin,
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [draftSignature]);

  // Free object URLs on unmount
  useEffect(
    () => () => {
      clearTimeout(flashTimer.current);
      clearTimeout(toastTimer.current);
      items.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
      if (result) URL.revokeObjectURL(result.url);
    },
    [],
  );

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

  /** Add files to the list, show them as "adding", then highlight them once their previews are ready. */
  const append = async (files: File[]) => {
    const fresh: Item[] = files.map((file) => ({ id: uid(), file, rotation: 0 }));
    const label = fresh.length === 1 ? single : noun;
    setItems((prev) => [...prev, ...fresh]);
    notify('adding', `Adding ${fresh.length} ${label}…`);
    const problems: { id: string; name: string; reason: ImageProblem }[] = [];
    await Promise.all(
      fresh.map(async (it) => {
        const thumb = await makeThumb(it.file, 0);
        if (thumb.failed) problems.push({ id: it.id, name: it.file.name, reason: thumb.failed });
        setItems((prev) => {
          if (!prev.some((p) => p.id === it.id)) {
            URL.revokeObjectURL(thumb.url); // removed before the preview was ready
            return prev;
          }
          return prev.map((p) => (p.id === it.id ? { ...p, preview: thumb.url, w: thumb.w, h: thumb.h } : p));
        });
      }),
    );
    if (problems.length) {
      setBad((b) => ({ ...b, ...Object.fromEntries(problems.map((p) => [p.id, p.reason])) }));
      setError(problemSummary(problems.map((p) => ({ name: p.name, reason: p.reason }))));
    }
    showFlash(
      fresh.map((f) => f.id),
      'added',
    );
    notify('done', `${fresh.length} ${label} added`, 3200);
  };

  const addFiles = (files: File[]) => {
    const good = files.filter((f) => OK_TYPES.includes(f.type));
    setError(good.length < files.length ? 'Some files were skipped. Please choose JPG, PNG or WebP images.' : '');
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
    if (unique.length) append(unique);
    if (dupes.length) setDups((prev) => [...prev, ...dupes]);
    if (result) clearResult();
  };

  /** Duplicate popup answers: "Yes, I want it" adds it anyway, "Delete" skips it. */
  const keepDuplicate = () => {
    const [file, ...rest] = dups;
    if (file) append([file]);
    setDups(rest);
  };
  const dropDuplicate = () => setDups((prev) => prev.slice(1));

  /** Turn one image 90 degrees clockwise (applies to its preview and to the PDF). */
  const turn = async (it: Item) => {
    const rotation = ((((it.rotation ?? 0) + 90) % 360) as Rotation);
    setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, rotation } : p)));
    const thumb = await makeThumb(it.file, rotation);
    setItems((prev) => {
      const cur = prev.find((p) => p.id === it.id);
      if (!cur || cur.rotation !== rotation) {
        URL.revokeObjectURL(thumb.url); // removed, or rotated again meanwhile
        return prev;
      }
      if (cur.preview) URL.revokeObjectURL(cur.preview);
      return prev.map((p) => (p.id === it.id ? { ...p, preview: thumb.url } : p));
    });
  };

  /** Any image can be rotated: a portrait file can still hold a sideways scan. */
  const rotate = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (it) void turn(it);
  };

  /** One click for a big batch of sideways pages. */
  const rotateAll = () => items.forEach((it) => void turn(it));

  const clearResult = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setPhase('idle');
  };

  const changeView = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem('pdf-photo-view', v);
    } catch {
      /* private mode: the choice just is not remembered */
    }
  };

  const reorder = (from: number, to: number) => {
    const it = items[from];
    if (!it || from === to) return;
    setRestored(0);
    setItems((prev) => moveItem(prev, from, to));
    showFlash([it.id], 'moved');
    notify('done', `Moved ${it.file.name} to position ${to + 1}`, 3200);
  };

  const remove = (id: string) => {
    // removing data clears any error: the problem image is gone, so is its message
    setError('');
    setBad((b) => {
      const { [id]: _removed, ...rest } = b;
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

  const convert = async () => {
    const known = items.filter((i) => bad[i.id]);
    if (known.length) {
      setError(problemSummary(known.map((i) => ({ name: i.file.name, reason: bad[i.id] }))));
      return;
    }
    setError('');
    setProgress(0);
    setPhase('working');
    const t0 = performance.now();
    try {
      const { jpgToPdf } = await loadEngine();
      const bytes = await jpgToPdf(
        items.map((i) => ({ file: i.file, rotation: (i.rotation ?? 0) as Rotation })),
        { pageSize, orientation, margin, onProgress: setProgress },
      );
      await holdUntil(t0, 800); // let the user see the progress popup even for tiny jobs
      setResult({ url: bytesToUrl(bytes), size: bytes.byteLength, pages: items.length });
      setPhase('done');
    } catch (e) {
      if (e instanceof ImageError) {
        const hit = items.find((i) => i.file.name === e.fileName);
        if (hit) setBad((b) => ({ ...b, [hit.id]: e.reason }));
        setError(describeImageProblem(e.fileName, e.reason));
      } else {
        console.error(e);
        setError('Something went wrong while creating the PDF. Please try again, or remove the last photos you added.');
      }
      setPhase('idle');
    }
  };

  /** Live page preview: uses the same geometry as the real PDF. */
  const look = (it: Item): PageLook => {
    const turned = (it.rotation ?? 0) % 180 !== 0;
    const iw = it.w ?? 3;
    const ih = it.h ?? 4;
    const { pageW, pageH, margin: m } = pageGeometry(pageSize, orientation, margin, turned ? ih : iw, turned ? iw : ih);
    return { aspect: pageW / pageH, padPct: (m / pageW) * 100 };
  };

  const busy = phase === 'working';

  if (phase === 'done' && result) {
    return (
      <div class="mx-auto max-w-2xl">
        <ResultCard
          url={result.url}
          filename={`${noun}.pdf`}
          size={result.size}
          detail={`${result.pages} ${result.pages === 1 ? 'page' : 'pages'}`}
          onReset={reset}
          resetLabel={`Convert more ${noun}`}
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
          accept={ACCEPT}
          multiple
          label={`Choose ${noun}`}
          hint="JPG, PNG or WebP. Nothing is uploaded."
          onFiles={addFiles}
          onIntent={() => void loadEngine()}
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
            <AddFilesButton accept={ACCEPT} multiple label={`Add more ${noun}`} onFiles={addFiles} onIntent={() => void loadEngine()} disabled={busy} />
            <span class="mr-auto ml-1 text-sm text-muted">
              {items.length} {items.length === 1 ? single : noun}
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
            <Button variant="secondary" size="sm" disabled={busy} onClick={rotateAll}>
              <RotateIcon size={14} />
              Rotate all
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={reset}>
              Remove all
            </Button>
          </div>

          {restored > 0 && (
            <div role="status" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-success-soft px-3 py-2 text-sm">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <span>
                We brought back your {restored} {restored === 1 ? single : noun} from your last visit. They are kept only in this browser, for 15 minutes after your last change.
              </span>
              <Button variant="link" size="sm" onClick={reset}>
                Start fresh
              </Button>
            </div>
          )}

          {error && <ErrorNotice message={error} />}

          <PageGrid items={items} look={look} onReorder={reorder} onRemove={remove} onRotate={rotate} view={view} flash={flash} bad={bad} disabled={busy} />
          <p class="text-sm text-muted">Drag any {single} to change the order (on a phone, press and hold it first), or tap its number to move it to any position. You can also drop more {noun} anywhere here.</p>
        </>
      }
      optionsTitle="PDF page options"
      options={
        <>
          <PdfPageOptions
            idPrefix="jpg"
            allowFit
            pageSize={pageSize}
            onPageSize={setPageSize}
            orientation={orientation}
            onOrientation={setOrientation}
            margin={margin}
            onMargin={setMargin}
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
        {dups.length > 0 && (
          <DuplicateDialog file={dups[0]} more={dups.length - 1} onKeep={keepDuplicate} onDelete={dropDuplicate} />
        )}

        {toast && <Toast kind={toast.kind} text={toast.text} />}

        {busy && (
          <BusyDialog
            title={`Converting your ${noun}…`}
            progress={progress}
            note={`Please wait. Your ${noun} stay on your device.`}
          />
        )}
        </>
      }
    />
  );
}
