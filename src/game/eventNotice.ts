/**
 * Aviso do evento Desembarque na Pokébola das Missões 20.
 *
 * Regra combinada com o jogador:
 *  - o aviso acende a cada 30 minutos, em janelas de 10 minutos;
 *  - ao abrir o banner, ele fica 2 horas sem aparecer e a primeira janela
 *    seguinte começa exatamente no fim desse cooldown;
 *  - fora da janela (ou durante o cooldown), clicar na Pokébola abre as
 *    Missões 20 normalmente;
 *  - a primeira visita acende na hora, para o jogador descobrir o evento.
 *
 * O horário da última abertura fica salvo no navegador para o cooldown
 * sobreviver a recarregamentos.
 */

export const EVENT_NOTICE_INTERVAL_MS = 30 * 60 * 1000;
export const EVENT_NOTICE_WINDOW_MS = 10 * 60 * 1000;
export const EVENT_NOTICE_COOLDOWN_MS = 2 * 60 * 60 * 1000;
export const EVENT_NOTICE_STORAGE_KEY = "rubym.evento-desembarque.last-opened.v1";

export type EventNoticeStatus = {
  /** Pode abrir o banner agora. */
  due: boolean;
  /** A Pokébola deve ficar piscando (mesma condição de `due`). */
  flashing: boolean;
  /** Ainda não houve nenhuma abertura salva neste navegador. */
  firstTime: boolean;
  /** Fim do cooldown de 2 horas (0 na primeira visita). */
  cooldownUntil: number;
  /** Início da janela de aviso atual (ou da próxima, durante o cooldown). */
  windowStart: number;
  /** Fim da janela de aviso atual (ou da próxima, durante o cooldown). */
  windowEnd: number;
  /** Próximo instante em que o aviso volta a acender. */
  nextAt: number;
};

type ReadableStorage = {
  getItem(key: string): string | null;
  setItem?(key: string, value: string): void;
};

type WritableStorage = {
  setItem(key: string, value: string): void;
};

function normalizeLastOpened(lastOpenedAt: number | null | undefined): number | null {
  if (typeof lastOpenedAt !== "number" || !Number.isFinite(lastOpenedAt) || lastOpenedAt <= 0) return null;
  return lastOpenedAt;
}

/**
 * Calcula o estado do aviso. `now` e `lastOpenedAt` são timestamps em ms.
 * Função pura para facilitar os testes de regressão.
 */
export function eventNoticeStatus(now: number, lastOpenedAt: number | null | undefined): EventNoticeStatus {
  const opened = normalizeLastOpened(lastOpenedAt);
  const firstTime = opened === null;
  const cooldownUntil = firstTime ? 0 : opened + EVENT_NOTICE_COOLDOWN_MS;

  if (firstTime) {
    return {
      due: true,
      flashing: true,
      firstTime: true,
      cooldownUntil: 0,
      windowStart: now,
      windowEnd: now + EVENT_NOTICE_WINDOW_MS,
      nextAt: now,
    };
  }

  if (now < cooldownUntil) {
    return {
      due: false,
      flashing: false,
      firstTime: false,
      cooldownUntil,
      windowStart: cooldownUntil,
      windowEnd: cooldownUntil + EVENT_NOTICE_WINDOW_MS,
      nextAt: cooldownUntil,
    };
  }

  // As janelas são ancoradas no fim do cooldown: a primeira abre exatamente
  // 2h depois da última abertura e as seguintes a cada 30 minutos.
  const elapsed = now - cooldownUntil;
  const windowStart = cooldownUntil + Math.floor(elapsed / EVENT_NOTICE_INTERVAL_MS) * EVENT_NOTICE_INTERVAL_MS;
  const windowEnd = windowStart + EVENT_NOTICE_WINDOW_MS;
  const due = now < windowEnd;

  return {
    due,
    flashing: due,
    firstTime: false,
    cooldownUntil,
    windowStart,
    windowEnd,
    nextAt: due ? now : windowStart + EVENT_NOTICE_INTERVAL_MS,
  };
}

export function eventNoticeIsDue(now: number, lastOpenedAt: number | null | undefined): boolean {
  return eventNoticeStatus(now, lastOpenedAt).due;
}

export function readEventNoticeLastOpened(
  storage: ReadableStorage | null | undefined,
  now = Date.now(),
): number | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(EVENT_NOTICE_STORAGE_KEY);
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return null;
    // Relógio do aparelho voltou no tempo: reancora o cooldown em "agora"
    // para o aviso não ficar preso por mais de 2 horas.
    if (value > now) {
      try {
        storage.setItem?.(EVENT_NOTICE_STORAGE_KEY, String(Math.round(now)));
      } catch {
        /* storage indisponível */
      }
      return now;
    }
    return value;
  } catch {
    return null;
  }
}

export function writeEventNoticeLastOpened(
  value: number,
  storage: WritableStorage | null | undefined,
): void {
  if (!storage || !Number.isFinite(value) || value <= 0) return;
  try {
    storage.setItem(EVENT_NOTICE_STORAGE_KEY, String(Math.round(value)));
  } catch {
    /* localStorage indisponível */
  }
}
