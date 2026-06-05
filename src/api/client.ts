import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'questboard-settings' });

export function getServerUrl(): string {
  return storage.getString('serverUrl') ?? '';
}

export function setServerUrl(url: string): void {
  storage.set('serverUrl', url);
}

function apiBase(): string {
  const url = getServerUrl();
  return url ? `http://${url.replace(/^https?:\/\//, '')}` : '';
}

async function apiFetch(path: string, options?: RequestInit): Promise<any> {
  const base = apiBase();
  if (!base) throw new Error('No server URL configured');
  const res = await fetch(`${base}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchState(): Promise<any> {
  return apiFetch('/state');
}

export async function postState(data: any): Promise<void> {
  await apiFetch('/state', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchConfig(): Promise<any> {
  return apiFetch('/config');
}

export async function postConfig(data: any): Promise<void> {
  await apiFetch('/config', { method: 'POST', body: JSON.stringify(data) });
}

export async function testConnection(serverUrl: string): Promise<boolean> {
  try {
    const base = `http://${serverUrl.replace(/^https?:\/\//, '')}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/api/config`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

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
    const wsUrl = `ws://${url.replace(/^https?:\/\//, '')}/ws`;
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
