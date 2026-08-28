export type ConnectorAction =
  | 'GET_RESOURCES'
  | 'GET_INTERFACES'
  | 'GET_HOTSPOT_USERS'
  | 'CREATE_HOTSPOT_USER'
  | 'UPDATE_HOTSPOT_USER'
  | 'DELETE_HOTSPOT_USER'
  | 'ENABLE_HOTSPOT_USER'
  | 'DISABLE_HOTSPOT_USER'
  | 'GET_ACTIVE_SESSIONS'
  | 'DISCONNECT_ACTIVE_SESSION'
  | 'GET_USER_PROFILES'
  | 'CREATE_USER_PROFILE'
  | 'GET_TRAFFIC_RATES'
  | 'PING_TEST';

export type CommandStatus = 'PENDING' | 'DISPATCHED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface ConnectorCommand<T = unknown> {
  commandId: string;
  connectorId?: string;
  action: ConnectorAction;
  payload: T;
  status: CommandStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  timeoutMs?: number;
  result?: ConnectorResponse;
}

export interface ConnectorResponse<T = unknown> {
  commandId: string;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    raw?: unknown;
  };
  executedAt: string;
  durationMs: number;
}

export interface MikroTikResourceData {
  uptime: string;
  version: string;
  buildTime: string;
  freeMemory: number;
  totalMemory: number;
  cpu: string;
  cpuCount: number;
  cpuFrequency: number;
  cpuLoad: number;
  freeHddSpace: number;
  totalHddSpace: number;
  architectureName: string;
  boardName: string;
  platform: string;
}

export interface MikroTikInterfaceData {
  name: string;
  type: string;
  running: boolean;
  rxByte: number;
  txByte: number;
  comment?: string;
}

export interface MikroTikActiveSessionData {
  id: string;
  server: string;
  user: string;
  address: string;
  macAddress: string;
  loginBy: string;
  uptime: string;
  sessionTimeLeft?: string;
  idleTime: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  radius: boolean;
}
