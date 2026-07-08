const BUCKET_SIZE_MINUTES = 10;
const BUCKET_COUNT = 6;

export type SessionDurationBucket = {
  label: string;
  fromMinutes: number;
  toMinutes: number | null;
  value: number;
};

export type SessionDurationStats = {
  periodDays: number;
  totalSessions: number;
  averageSeconds: number;
  medianSeconds: number;
  buckets: SessionDurationBucket[];
};

type SessionDurationRow = {
  durationMs: number;
};

export function buildSessionDurationStats(rows: SessionDurationRow[], periodDays: number): SessionDurationStats {
  const durationsSeconds = rows.map((row) => Math.max(0, Math.round(Number(row.durationMs ?? 0) / 1000)));
  const buckets = createEmptyBuckets();

  for (const durationSeconds of durationsSeconds) {
    const durationMinutes = durationSeconds / 60;
    const bucketIndex =
      durationMinutes >= BUCKET_SIZE_MINUTES * BUCKET_COUNT
        ? BUCKET_COUNT
        : Math.floor(durationMinutes / BUCKET_SIZE_MINUTES);
    buckets[bucketIndex].value += 1;
  }

  return {
    periodDays,
    totalSessions: durationsSeconds.length,
    averageSeconds: average(durationsSeconds),
    medianSeconds: median(durationsSeconds),
    buckets
  };
}

export function formatDurationLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0 сек";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)} сек`;
  }

  const minutes = Math.floor(seconds / 60);
  const restSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return restSeconds > 0 ? `${minutes} мин ${restSeconds} сек` : `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`;
}

function createEmptyBuckets(): SessionDurationBucket[] {
  const buckets: SessionDurationBucket[] = Array.from({ length: BUCKET_COUNT }, (_, index) => ({
    label: `${index * BUCKET_SIZE_MINUTES}–${(index + 1) * BUCKET_SIZE_MINUTES} мин`,
    fromMinutes: index * BUCKET_SIZE_MINUTES,
    toMinutes: (index + 1) * BUCKET_SIZE_MINUTES,
    value: 0
  }));

  buckets.push({
    label: `${BUCKET_SIZE_MINUTES * BUCKET_COUNT}+ мин`,
    fromMinutes: BUCKET_SIZE_MINUTES * BUCKET_COUNT,
    toMinutes: null,
    value: 0
  });

  return buckets;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function median(values: number[]) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}
