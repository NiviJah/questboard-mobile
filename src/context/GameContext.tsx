import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { fetchConfig, fetchState, postConfig, postState, wsClient } from '../api/client';
import { loadConfig, loadState, saveConfig, saveState } from '../storage/db';
import {
  ALL_CHORES,
  DEFAULT_POWER_UP_SETTINGS,
  REWARDS,
} from '../game/data';
import {
  checkNewBadges,
  checkPowerUpTriggers,
  choreDoneKey,
  cleanExpiredPowerUps,
  critChanceForLevel,
  dateSeededMonster,
  getLevelFromXP,
  getRewardsFor,
  initDungeonMap,
  isChoreDoneForPlayer,
  luckForLevel,
  monthKey as getMonthKey,
  rollLoot,
  streakMultiplier,
  todayKey as getTodayKey,
  weekKey as getWeekKey,
} from '../game/logic';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  mode: 'kids' | 'adults';
  class: string;
}

export interface GameState {
  gold: Record<string, number>;
  xp: Record<string, number>;
  streaks: Record<string, number>;
  prestige: Record<string, number>;
  weeklyGold: Record<string, number>;
  badges: Record<string, string[]>;
  badgeProgress: Record<string, any>;
  selectedTitles: Record<string, string | null>;
  dailyDone: Record<string, string>;
  weeklyDone: Record<string, string>;
  monthlyDone: Record<string, string>;
  weekKey: string;
  todayKey: string;
  monthKey: string;
  history: any[];
  bounties: any[];
  monsterDamage: Record<string, number>;
  monsterPenalties: Record<string, number>;
  damageLog: Record<string, string[]>;
  overkillCharge: Record<string, number>;
  storedPowerTokens: Record<string, string[]>;
  activePowerUps: Record<string, any[]>;
  dungeonMaps: Record<string, any>;
}

export interface GameConfig {
  players: Player[];
  enabledChores: string[];
  customChores: any[];
  rewards: any[];
  powerUpSettings: Record<string, any>;
  weekStartDay: number;
  uiScale: number;
  crtOverlay: boolean;
}

interface GameContextValue {
  state: GameState;
  config: GameConfig;
  currentPlayer: number;
  setCurrentPlayer: (idx: number) => void;
  serverUrl: string;
  isOnline: boolean;
  completeChore: (choreId: string, freq: 'daily' | 'weekly' | 'monthly') => void;
  fightDungeonMonster: (playerId: string, damage: number) => void;
  redeemReward: (rewardId: string, playerId: string) => void;
  updateConfig: (cfg: Partial<GameConfig>) => Promise<void>;
  refreshFromServer: () => Promise<void>;
  getActiveChores: (player: Player, freq: 'daily' | 'weekly' | 'monthly') => any[];
  getPlayerRewards: (player: Player) => any[];
  getMonster: (player: Player) => any | null;
}

// ── Default state ─────────────────────────────────────────────────────────────

const defaultState: GameState = {
  gold: {},
  xp: {},
  streaks: {},
  prestige: {},
  weeklyGold: {},
  badges: {},
  badgeProgress: {},
  selectedTitles: {},
  dailyDone: {},
  weeklyDone: {},
  monthlyDone: {},
  weekKey: '',
  todayKey: '',
  monthKey: '',
  history: [],
  bounties: [],
  monsterDamage: {},
  monsterPenalties: {},
  damageLog: {},
  overkillCharge: {},
  storedPowerTokens: {},
  activePowerUps: {},
  dungeonMaps: {},
};

const defaultConfig: GameConfig = {
  players: [],
  enabledChores: ALL_CHORES.map(c => c.id),
  customChores: [],
  rewards: REWARDS,
  powerUpSettings: DEFAULT_POWER_UP_SETTINGS,
  weekStartDay: 1,
  uiScale: 1,
  crtOverlay: false,
};

// ── Context ───────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

// ── Auto-reset helpers ────────────────────────────────────────────────────────

function applyAutoResets(state: GameState, config: GameConfig): GameState {
  const tKey = getTodayKey();
  const wKey = getWeekKey(config.weekStartDay);
  const mKey = getMonthKey();
  let s = { ...state };
  if (s.todayKey !== tKey) {
    s = { ...s, dailyDone: {}, todayKey: tKey };
  }
  if (s.weekKey !== wKey) {
    s = { ...s, weeklyDone: {}, weekKey: wKey };
  }
  if (s.monthKey !== mKey) {
    s = { ...s, monthlyDone: {}, monthKey: mKey };
  }
  s.activePowerUps = cleanExpiredPowerUps(s.activePowerUps);
  return s;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<GameState>(defaultState);
  const [config, setConfigRaw] = useState<GameConfig>(defaultConfig);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [serverUrl, setServerUrl] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  stateRef.current = state;
  configRef.current = config;

  // Persist + update state
  const applyState = useCallback((s: GameState) => {
    const reset = applyAutoResets(s, configRef.current);
    setStateRaw(reset);
    saveState(reset);
  }, []);

  const applyConfig = useCallback((c: GameConfig) => {
    setConfigRaw(c);
    saveConfig(c);
  }, []);

  // Push state to server + broadcast via WS
  const pushState = useCallback(async (s: GameState) => {
    try {
      await postState(s);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  const refreshFromServer = useCallback(async () => {
    try {
      const [remoteState, remoteConfig] = await Promise.all([fetchState(), fetchConfig()]);
      if (remoteState && Object.keys(remoteState).length) {
        applyState(remoteState);
      }
      if (remoteConfig && !remoteConfig.needs_setup) {
        applyConfig(remoteConfig);
      }
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, [applyState, applyConfig]);

  // Boot: load SQLite cache then try server
  useEffect(() => {
    (async () => {
      const cachedConfig = await loadConfig();
      const cachedState = await loadState();
      const cfg = cachedConfig ?? defaultConfig;
      applyConfig(cfg);
      if (cachedState) {
        applyState(cachedState);
      }
      refreshFromServer();
    })();

    // WS listener
    const unsub = wsClient.addListener((msg) => {
      if (msg.type === 'state' && msg.data) {
        applyState(msg.data);
      } else if (msg.type === 'config' && msg.data) {
        applyConfig(msg.data);
      }
    });
    wsClient.connect();

    // AppState foreground hook
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        refreshFromServer();
      }
    });

    return () => {
      unsub();
      wsClient.disconnect();
      appStateSub.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Game actions ─────────────────────────────────────────────────────────────

  const completeChore = useCallback(
    (choreId: string, freq: 'daily' | 'weekly' | 'monthly') => {
      const s = stateRef.current;
      const cfg = configRef.current;
      const allChores = [...ALL_CHORES, ...cfg.customChores];
      const chore = allChores.find(c => c.id === choreId);
      if (!chore) return;

      const player = cfg.players[currentPlayer];
      if (!player) return;

      const doneKey = choreDoneKey(chore, player.id);
      const doneStore =
        freq === 'daily' ? s.dailyDone : freq === 'weekly' ? s.weeklyDone : s.monthlyDone;

      if (isChoreDoneForPlayer(doneStore, chore, player.id)) return;

      const totalXp = s.xp[player.id] ?? 0;
      const { level } = getLevelFromXP(totalXp);
      const crit = Math.random() < critChanceForLevel(level);
      const streak = s.streaks[player.id] ?? 0;
      const mult = streakMultiplier(streak) * (crit ? 2 : 1);
      const damage = Math.round(chore.pts * mult);

      // Update monster HP
      const currentDmg = s.monsterDamage[player.id] ?? 0;
      const monster = getMonster(player);
      const maxHP = monster?.maxHP ?? 10;
      const newDmg = Math.min(currentDmg + damage, maxHP);
      const killed = newDmg >= maxHP;

      let goldGain = 0;
      let xpGain = chore.pts;
      let newHistory = s.history;
      let newStreaks = { ...s.streaks };
      let newBadges = { ...s.badges };
      let newOverkill = { ...s.overkillCharge };
      let newActivePowerUps = { ...s.activePowerUps };
      let newWeeklyGold = { ...s.weeklyGold };

      if (killed) {
        const luckLevel = luckForLevel(level);
        const loot = rollLoot(luckLevel * 10);
        const goldMultiplier =
          s.activePowerUps[player.id]?.some((p: any) => p.id === 'gold_rush') ? 2 : 1;
        goldGain = (monster?.gold ?? 6) * goldMultiplier + (loot?.gold ?? 0);
        xpGain += loot?.xp ?? 0;
        newStreaks[player.id] = streak + 1;
        newHistory = [
          { playerId: player.id, monster: monster?.name, gold: goldGain, ts: Date.now() },
          ...s.history.slice(0, 99),
        ];
        const overkill = damage - maxHP + currentDmg;
        const newCharge = (s.overkillCharge[player.id] ?? 0) + (overkill > 0 ? 1 : 0);
        newOverkill[player.id] = newCharge;

        // Badge checks
        const playerBadges = s.badges[player.id] ?? [];
        const gold = (s.gold[player.id] ?? 0) + goldGain;
        const earned = checkNewBadges(playerBadges, {
          streak: newStreaks[player.id],
          gold,
          monstersKilled: newHistory.filter(h => h.playerId === player.id).length,
          rewardsRedeemed: s.badgeProgress[player.id]?.rewardsRedeemed ?? 0,
          luckyCount: s.badgeProgress[player.id]?.luckyCount ?? 0,
          penaltyFreeDays: s.badgeProgress[player.id]?.penaltyFreeDays ?? 0,
        });
        if (earned.length) {
          newBadges[player.id] = [...playerBadges, ...earned];
        }

        // Power-up trigger checks
        const dailyCount = Object.keys({
          ...s.dailyDone,
          [doneKey]: player.id,
        }).filter(k => k.startsWith('daily') || true).length;
        const triggered = checkPowerUpTriggers(cfg.powerUpSettings, {
          dailyChores: dailyCount,
          weeklyChores: Object.keys(s.weeklyDone).length,
          monthlyChores: Object.keys(s.monthlyDone).length,
          killStreak: newStreaks[player.id],
          allDailiesDone: 0,
        });
        if (triggered.length) {
          const now = Date.now();
          const existing = newActivePowerUps[player.id] ?? [];
          const newPUs = triggered
            .filter(id => !existing.some((p: any) => p.id === id))
            .map(id => ({
              id,
              activatedAt: now,
              durationHours: cfg.powerUpSettings[id]?.durationHours ?? 24,
            }));
          newActivePowerUps[player.id] = [...existing, ...newPUs];
        }
      }

      const newDoneStore = { ...doneStore, [doneKey]: player.id };
      newWeeklyGold[player.id] = (s.weeklyGold[player.id] ?? 0) + goldGain;

      const newState: GameState = {
        ...s,
        gold: { ...s.gold, [player.id]: (s.gold[player.id] ?? 0) + goldGain },
        xp: { ...s.xp, [player.id]: totalXp + xpGain },
        streaks: newStreaks,
        weeklyGold: newWeeklyGold,
        badges: newBadges,
        overkillCharge: newOverkill,
        activePowerUps: newActivePowerUps,
        monsterDamage: {
          ...s.monsterDamage,
          [player.id]: killed ? 0 : newDmg,
        },
        damageLog: {
          ...s.damageLog,
          [player.id]: [
            `${crit ? '💥 CRIT ' : ''}${chore.icon} -${damage} HP`,
            ...(s.damageLog[player.id] ?? []).slice(0, 2),
          ],
        },
        history: newHistory,
        ...(freq === 'daily' ? { dailyDone: newDoneStore } : {}),
        ...(freq === 'weekly' ? { weeklyDone: newDoneStore } : {}),
        ...(freq === 'monthly' ? { monthlyDone: newDoneStore } : {}),
      };

      applyState(newState);
      pushState(newState);
    },
    [currentPlayer, applyState, pushState],
  );

  const fightDungeonMonster = useCallback(
    (playerId: string, damage: number) => {
      const s = stateRef.current;
      const dungeonMap = s.dungeonMaps[playerId];
      if (!dungeonMap?.activeMonster) return;
      const mon = dungeonMap.activeMonster;
      const newHP = Math.max(0, (mon.currentHP ?? mon.maxHP) - damage);
      const killed = newHP === 0;
      let goldGain = 0;
      if (killed) {
        goldGain = mon.gold ?? 6;
      }
      const newMap = {
        ...dungeonMap,
        activeMonster: killed ? null : { ...mon, currentHP: newHP },
      };
      const newState: GameState = {
        ...s,
        gold: { ...s.gold, [playerId]: (s.gold[playerId] ?? 0) + goldGain },
        dungeonMaps: { ...s.dungeonMaps, [playerId]: newMap },
      };
      applyState(newState);
      pushState(newState);
    },
    [applyState, pushState],
  );

  const redeemReward = useCallback(
    (rewardId: string, playerId: string) => {
      const s = stateRef.current;
      const cfg = configRef.current;
      const allRewards = [...cfg.rewards, ...REWARDS];
      const reward = allRewards.find(r => r.id === rewardId);
      if (!reward) return;
      const gold = s.gold[playerId] ?? 0;
      if (gold < reward.cost) return;
      const newState: GameState = {
        ...s,
        gold: { ...s.gold, [playerId]: gold - reward.cost },
        history: [
          { playerId, rewardId, rewardName: reward.name, gold: -reward.cost, ts: Date.now() },
          ...s.history.slice(0, 99),
        ],
        badgeProgress: {
          ...s.badgeProgress,
          [playerId]: {
            ...(s.badgeProgress[playerId] ?? {}),
            rewardsRedeemed: ((s.badgeProgress[playerId]?.rewardsRedeemed) ?? 0) + 1,
          },
        },
      };
      applyState(newState);
      pushState(newState);
    },
    [applyState, pushState],
  );

  const updateConfig = useCallback(
    async (partial: Partial<GameConfig>) => {
      const newConfig = { ...configRef.current, ...partial };
      applyConfig(newConfig);
      try {
        await postConfig(newConfig);
      } catch {}
    },
    [applyConfig],
  );

  // ── Derived helpers ──────────────────────────────────────────────────────────

  const getActiveChores = useCallback(
    (player: Player, freq: 'daily' | 'weekly' | 'monthly') => {
      const cfg = configRef.current;
      const allChores = [...ALL_CHORES, ...cfg.customChores];
      const isKid = player.mode === 'kids';
      return allChores.filter(c => {
        if (c.freq !== freq) return false;
        if (c.who !== 'all' && (isKid ? c.who !== 'kids' : c.who !== 'adults')) return false;
        if (!cfg.enabledChores.includes(c.id)) return false;
        return true;
      });
    },
    [],
  );

  const getPlayerRewards = useCallback((player: Player) => {
    return getRewardsFor(player, configRef.current.rewards);
  }, []);

  function getMonster(player: Player) {
    const cfg = configRef.current;
    const s = stateRef.current;
    const { level } = getLevelFromXP(s.xp[player.id] ?? 0);
    return dateSeededMonster(player, getTodayKey(), level);
  }

  // ── Context value ─────────────────────────────────────────────────────────────

  const value: GameContextValue = {
    state,
    config,
    currentPlayer,
    setCurrentPlayer,
    serverUrl,
    isOnline,
    completeChore,
    fightDungeonMonster,
    redeemReward,
    updateConfig,
    refreshFromServer,
    getActiveChores,
    getPlayerRewards,
    getMonster,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
