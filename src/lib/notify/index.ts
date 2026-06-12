// Pluggable notification layer. Phase 1 = console/no-op provider.
// Phase 2 = swap in WhatsAppProvider (Cloud API) without touching call sites.
import type { ComplaintStatus } from '../types';

export interface NotifyPayload {
  to: string; // citizen phone
  ticketCode: string;
  citizenName: string;
}

export interface NotificationProvider {
  onCreated(p: NotifyPayload): Promise<void>;
  onStatusChanged(p: NotifyPayload & { status: ComplaintStatus }): Promise<void>;
  onResolved(p: NotifyPayload & { afterPhotoUrl?: string | null }): Promise<void>;
}

// Phase 1 default: logs only. No external dependency, no cost.
class ConsoleProvider implements NotificationProvider {
  async onCreated(p: NotifyPayload) {
    console.log(`[notify] created ${p.ticketCode} -> ${p.to}`);
  }
  async onStatusChanged(p: NotifyPayload & { status: ComplaintStatus }) {
    console.log(`[notify] status ${p.status} ${p.ticketCode} -> ${p.to}`);
  }
  async onResolved(p: NotifyPayload) {
    console.log(`[notify] resolved ${p.ticketCode} -> ${p.to}`);
  }
}

// Phase 2 stub. Implement these against WhatsApp Cloud API, then flip the factory.
// class WhatsAppProvider implements NotificationProvider { ... }

let _provider: NotificationProvider | null = null;
export function notifier(): NotificationProvider {
  if (!_provider) _provider = new ConsoleProvider();
  return _provider;
}
