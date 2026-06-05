from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, os, asyncio
from typing import List

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_DATA_DIR = os.environ.get("QUESTBOARD_DATA", "/data")
STATE_FILE = os.path.join(_DATA_DIR, "state.json")
CONFIG_FILE = os.path.join(_DATA_DIR, "config.json")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
    def disconnect(self, ws: WebSocket):
        self.active = [c for c in self.active if c != ws]
    async def broadcast(self, msg: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active = [c for c in self.active if c != ws]

manager = ConnectionManager()

def read_json(path):
    if os.path.exists(path):
        try:
            with open(path) as f: return json.load(f)
        except: pass
    return None

def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f: json.dump(data, f)

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send current state immediately on connect
        state = read_json(STATE_FILE) or {}
        await ws.send_json({"type": "state", "data": state})
        while True:
            await asyncio.wait_for(ws.receive_text(), timeout=30)
    except (WebSocketDisconnect, asyncio.TimeoutError, Exception):
        manager.disconnect(ws)

@app.get("/api/state")
def get_state():
    return read_json(STATE_FILE) or {}

@app.post("/api/state")
async def post_state(request: Request):
    data = await request.json()
    write_json(STATE_FILE, data)
    await manager.broadcast({"type": "state", "data": data})
    return {"ok": True}

@app.get("/api/config")
def get_config():
    config = read_json(CONFIG_FILE)
    if config is None: return {"needs_setup": True}
    return config

@app.post("/api/config")
async def post_config(request: Request):
    data = await request.json()
    write_json(CONFIG_FILE, data)
    await manager.broadcast({"type": "config", "data": data})
    return {"ok": True}

# Serve frontend static files if present
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
