// Global print queue (module-level singleton for the running tab)

export type PrintJob = {
  canvas: HTMLCanvasElement;
  sessionId: string;
  copies: number;
  layout?: string;
};

export type PrintLogEntry = {
  sessionId: string;
  layout?: string;
  copies: number;
  at: number;
};

type Listener = () => void;

const printQueue: PrintJob[] = [];
let isPrinting = false;
const printLog: PrintLogEntry[] = [];
const listeners = new Set<Listener>();

let printerFn: ((canvas: HTMLCanvasElement) => Window | null) | null = null;

export function setPrinter(fn: (canvas: HTMLCanvasElement) => Window | null) {
  printerFn = fn;
}

export function subscribePrintQueue(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((l) => l());
}

export function getPrintQueueState() {
  return {
    queueLength: printQueue.length,
    isPrinting,
    log: [...printLog].slice(0, 10),
  };
}

export function clearPrintQueue() {
  printQueue.length = 0;
  notify();
}

export function enqueuePrint(canvas: HTMLCanvasElement, sessionId: string, copies: number, layout?: string) {
  printQueue.push({ canvas, sessionId, copies, layout });
  notify();
  void processQueue();
}

async function processQueue() {
  if (isPrinting || printQueue.length === 0) return;
  isPrinting = true;
  notify();
  const job = printQueue.shift()!;
  try {
    for (let i = 0; i < job.copies; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 5000));
      if (printerFn) printerFn(job.canvas);
    }
    printLog.unshift({
      sessionId: job.sessionId,
      layout: job.layout,
      copies: job.copies,
      at: Date.now(),
    });
    if (printLog.length > 20) printLog.length = 20;
  } catch (e) {
    console.error("print job failed", e);
  } finally {
    isPrinting = false;
    notify();
    void processQueue();
  }
}
