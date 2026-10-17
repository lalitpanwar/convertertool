import { useEffect, useRef, useState } from 'preact/hooks';
import Dropzone from './Dropzone';
import FileList, { type Item } from './FileList';
import BusyDialog from './BusyDialog';
import ResultCard from './ResultCard';
import ErrorNotice from './ErrorNotice';
import Button from '@/components/ui/Button';
import { holdUntil, moveItem, uid } from '@/lib/utils';
import { bytesToUrl } from '@/lib/download';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage/draft';
import { useDraftWipe } from '@/lib/storage/useDraftWipe';
import { useAutoDismiss } from '@/lib/useAutoDismiss';

type Phase = 'idle' | 'working' | 'done';

// Heavy code (pdf-lib) is loaded only when needed.
const loadEngine = () => import('@/lib/pdf/merge');

interface SavedDraft {
  items: { id: string; file: File }[];
}

export default function MergePdfTool({ draftKey = 'merge-pdf' }: { draftKey?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(0);
  const draftReady = useRef(false);
  const onDownloaded = useDraftWipe(draftKey);
  // the "brought back" note fades away by itself
  useAutoDismiss(restored > 0, () => setRestored(0));
  /** a restored draft must not be saved again straight away (that would restart its 15-minute clock) */
  const skipNextSave = useRef(false);
  const [result, setResult] = useState<{ url: string; size: number; pages: number } | null>(null);

  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  // Bring back the files after a refresh, and save changes as they happen
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadDraft<SavedDraft>(draftKey);
      if (!alive) return;
      if (saved?.items?.length) {
        skipNextSave.current = true;
        setItems(saved.items.map((s) => ({ id: s.id, file: s.file })));
        setRestored(saved.items.length);
      }
      draftReady.current = true;
    })();
    return () => {
      alive = false;
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
    setResult(null);
    setPhase('idle');
  };

  const addFiles = (files: File[]) => {
    setRestored(0);
    const good = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    setError(good.length < files.length ? 'Some files were skipped. Please choose PDF files.' : '');
    if (good.length === 0) return;
    setItems((prev) => [...prev, ...good.map((file) => ({ id: uid(), file }))]);
    if (result) clearResult();
  };

  const move = (index: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const reorder = (from: number, to: number) => setItems((prev) => moveItem(prev, from, to));

  const remove = (id: string) => {
    setError(''); // removing data clears any error
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const reset = () => {
    setItems([]);
    setRestored(0);
    setError('');
    setProgress(0);
    clearResult();
  };

  const merge = async () => {
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
          setError(
            e.reason === 'encrypted'
              ? `"${e.fileName}" is password protected. Remove the password first, then try again.`
              : `"${e.fileName}" could not be read. Remove it and try again.`,
          );
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

  if (phase === 'done' && result) {
    return (
      <ResultCard
        url={result.url}
        filename="merged.pdf"
        size={result.size}
        detail={`${result.pages} ${result.pages === 1 ? 'page' : 'pages'}`}
        onReset={reset}
        resetLabel="Merge more files"
        onDownload={onDownloaded}
        afterDownload="For your privacy, your saved files are removed from this browser within a minute."
      />
    );
  }

  return (
    <div class="mx-auto grid max-w-2xl gap-5">
      <Dropzone
        accept="application/pdf,.pdf"
        multiple
        label={items.length ? 'Add more PDFs' : 'Choose PDF files'}
        hint="Select two or more PDFs. Nothing is uploaded."
        compact={items.length > 0}
        onFiles={addFiles}
        onIntent={() => void loadEngine()}
      />

      {restored > 0 && (
        <p role="status" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-ctl bg-success-soft px-3 py-2 text-sm">
          <span>We brought back your {restored} {restored === 1 ? 'file' : 'files'} from your last visit. They are kept only in this browser, for 15 minutes after your last change.</span>
          <Button variant="link" size="sm" onClick={reset}>
            Start fresh
          </Button>
        </p>
      )}

      {error && <ErrorNotice message={error} />}

      {items.length > 0 && (
        <>
          <FileList items={items} onMove={move} onReorder={reorder} onRemove={remove} disabled={busy} unit="File" />

          {items.length < 2 && <p class="text-sm text-muted">Add at least one more PDF to merge.</p>}

          <Button size="cta" full onClick={merge} disabled={items.length < 2 || busy}>
            Merge PDFs
          </Button>

          {busy && <BusyDialog title="Merging your PDFs…" progress={progress} note="Please wait. Your files stay on your device." />}
        </>
      )}
    </div>
  );
}
