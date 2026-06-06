import { NativeModules } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'questboard-settings' });

const { QBNet } = NativeModules;

export function getServerUrl(): string {
  return storage.getString('serverUrl') ?? '';
}

export function setServerUrl(url: string): void {
  storage.set('serverUrl', url);
}

function apiBase(): string {
  const url = getServerUrl();
  if (!url) return '';
  if (url.startsWith('https://') || url.startsWith('http://')) return url.replace(/\/$/, '');
  return `http://${url}`;
}

let _reqCounter = 0;
function nextId(): string {
  return `${Date.now()}_${++_reqCounter}`;
}

function qbGet(url: string, timeoutMs = 12000): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = nextId();
    const deadline = Date.now() + timeoutMs;

    QBNet.get(url, id);

    const poll = () => {
      const raw: string | null = QBNet.poll(id);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.ok) {
            const body = parsed.body;
            resolve(typeof body === 'string' ? JSON.parse(body) : body ?? {});
          } else {
            reject(new Error(parsed.error ?? `HTTP ${parsed.status}`));
          }
        } catch {
          reject(new Error('Invalid response'));
        }
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error('Request timed out'));
        return;
      }
      setTimeout(poll, 100);
    };

    setTimeout(poll, 100);
  });
}

function qbPost(url: string, body: any, timeoutMs = 12000): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = nextId();
    const deadline = Date.now() + timeoutMs;

    QBNet.post(url, JSON.stringify(body), id);

    const poll = () => {
      const raw: string | null = QBNet.poll(id);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.ok) {
            const b = parsed.body;
            resolve(typeof b === 'string' ? JSON.parse(b) : b ?? {});
          } else {
            reject(new Error(parsed.error ?? `HTTP ${parsed.status}`));
          }
        } catch {
          reject(new Error('Invalid response'));
        }
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error('Request timed out'));
        return;
      }
      setTimeout(poll, 100);
    };

    setTimeout(poll, 100);
  });
}

export async function fetchState(): Promise<any> {
  const base = apiBase();
  if (!base) throw new Error('No server URL configured');
  return qbGet(`${base}/api/state`);
}

export async function postState(data: any): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('No server URL configured');
  await qbPost(`${base}/api/state`, data);
}

export async function fetchConfig(): Promise<any> {
  const base = apiBase();
  if (!base) throw new Error('No server URL configured');
  return qbGet(`${base}/api/config`);
}

export async function postConfig(data: any): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('No server URL configured');
  await qbPost(`${base}/api/config`, data);
}

export async function fetchHouseholdCode(): Promise<string> {
  const base = apiBase();
  if (!base) throw new Error('No server URL configured');
  const res = await qbGet(`${base}/api/household-code`);
  return res.code as string;
}

export async function joinHousehold(serverUrl: string, code: string): Promise<{ ok: boolean; error: string }> {
  const base = serverUrl.startsWith('http') ? serverUrl.replace(/\/$/, '') : `http://${serverUrl}`;
  try {
    const res = await qbPost(`${base}/api/join`, { code: code.toUpperCase().replace('-', '') }, 10000);
    return { ok: true, error: '' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Join failed' };
  }
}

export async function testConnection(serverUrl: string): Promise<{ ok: boolean; error: string }> {
  const base = serverUrl.startsWith('http') ? serverUrl.replace(/\/$/, '') : `http://${serverUrl}`;
  const id = nextId();
  const timeoutMs = 10000;
  const deadline = Date.now() + timeoutMs;

  console.log('[QB] testConnection via QBNet GET', `${base}/api/config`);
  QBNet.get(`${base}/api/config`, id);

  return new Promise((resolve) => {
    const poll = () => {
      const raw: string | null = QBNet.poll(id);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          console.log('[QB] testConnection result', parsed.ok, parsed.status);
          resolve(parsed.ok ? { ok: true, error: '' } : { ok: false, error: parsed.error ?? `HTTP ${parsed.status}` });
        } catch {
          resolve({ ok: false, error: 'Invalid response' });
        }
        return;
      }
      if (Date.now() > deadline) {
        console.log('[QB] testConnection TIMEOUT');
        resolve({ ok: false, error: 'Timed out' });
        return;
      }
      setTimeout(poll, 100);
    };
    setTimeout(poll, 100);
  });
}

// ── WebSocket (best-effort real-time updates) ─────────────────────────────────

type WsListener = (msg: { type: string; data: any }) => void;

class QuestboardWs {
  private ws: WebSocket | null = null;
  private listeners: WsListener[] = [];
  private backoff = 1000;
  private shouldConnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    this.shouldConnect = true;
    this.openSocket();
  }

  disconnect(): void {
    this.shouldConnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  addListener(fn: WsListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private openSocket(): void {
    const url = getServerUrl();
    if (!url || !this.shouldConnect) return;
    const isSecure = url.startsWith('https://');
    const wsUrl = `${isSecure ? 'wss' : 'ws'}://${url.replace(/^https?:\/\//, '')}/ws`;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => { this.backoff = 1000; };
      this.ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          this.listeners.forEach(fn => fn(msg));
        } catch {}
      };
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => this.scheduleReconnect();
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldConnect) return;
    this.reconnectTimer = setTimeout(() => {
      this.backoff = Math.min(this.backoff * 2, 30000);
      this.openSocket();
    }, this.backoff);
  }
}

export const wsClient = new QuestboardWs();
