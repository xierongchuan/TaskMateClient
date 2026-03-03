import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_DIR = path.join(__dirname, '..', '..', '.state');
const STATE_FILE = path.join(STATE_DIR, 'functional-state.json');

export interface FunctionalState {
  dealership1Id?: number;
  dealership1Name?: string;
  dealership2Id?: number;
  dealership2Name?: string;
  managerId?: number;
  managerLogin?: string;
  employee1Id?: number;
  employee1Login?: string;
  employee2Id?: number;
  employee2Login?: string;
  observerId?: number;
  observerLogin?: string;
  taskNotificationId?: number;
  taskCompletionId?: number;
  taskProofId?: number;
  taskGroupId?: number;
  generatorId?: number;
  generatorWeeklyId?: number;
  linkId?: number;
  link2Id?: number;
  delegationTaskId?: number;
}

export function readState(): FunctionalState {
  if (!fs.existsSync(STATE_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

export function writeState(state: FunctionalState): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function updateState(partial: Partial<FunctionalState>): void {
  const current = readState();
  writeState({ ...current, ...partial });
}
