#!/usr/bin/env python3
"""
One-shot patcher: wire O2CEngine to CanonicalCore.
- Adds a _canonical() accessor + getCanonicalOrders() method to
  war-rooms/o2c/services/o2c-engine.js. Each order is mapped to a
  canonical-compliant record (risk_level/sla_state derived from the
  engine's own SLA breach logic -- not re-invented) while the
  vertical-specific fields (customer/value/currency/notes) ride along
  unchanged.
- Adds the canonical-core.js <script> include to
  war-rooms/o2c/o2c-war-room.html, before o2c-engine.js so it's
  available when needed.
Additive only -- no existing method signatures change.
Idempotent. Run from repo root.
"""
import shutil
import datetime
import sys

results = []

def patch_file(path, label, old, new, marker=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        results.append((f"{label}: {path} not found", "FAIL"))
        return False

    check = marker if marker else new
    if check in content:
        results.append((f"{label}: already applied", "SKIP"))
        return False
    if old not in content:
        results.append((f"{label}: expected anchor not found — manual check needed", "FAIL"))
        return False

    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{path}.bak.{ts}"
    shutil.copy(path, backup_path)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    results.append((f"{label}: applied, backup -> {backup_path}", "PASS"))
    return True

def main():
    ENGINE_PATH = "war-rooms/o2c/services/o2c-engine.js"
    WARROOM_PATH = "war-rooms/o2c/o2c-war-room.html"

    # 1. Add canonical wiring methods to O2CEngine, just before the closing class brace.
    OLD_ENGINE = """    /** Relay payload for handoff to the O2C Strategist / Executive Portal tier. */
    buildRelayPayload(analysis) {
      return {
        vertical: 'o2c',
        orders: this.orders,
        kpis: this.computeKpis(),
        sla_breaches: this.getSlaBreaches(),
        risk_flags: this.getRiskFlags(),
        analysis: analysis || null,
        relayed_at: Date.now()
      };
    }
  }"""
    NEW_ENGINE = """    /** Relay payload for handoff to the O2C Strategist / Executive Portal tier. */
    buildRelayPayload(analysis) {
      return {
        vertical: 'o2c',
        orders: this.orders,
        kpis: this.computeKpis(),
        sla_breaches: this.getSlaBreaches(),
        risk_flags: this.getRiskFlags(),
        analysis: analysis || null,
        relayed_at: Date.now()
      };
    }

    /* ── Canonical core wiring ──────────────────────────────────
       Maps each order onto the shared cross-vertical field contract
       (architecture/canonical/entities.json) so WIP, Collective BNCA,
       and any future consumer can read O2C orders generically without
       knowing O2C-specific field names. Vertical-specific fields
       (customer/value/currency/notes) ride along unchanged -- this is
       additive, not a replacement schema. */
    async _canonical() {
      if (this._canonicalCore) return this._canonicalCore;
      if (typeof window === 'undefined' || !window.CanonicalCore) {
        console.warn('O2CEngine: CanonicalCore not available -- include /runtime/kernel/canonical-core.js before o2c-engine.js to enable getCanonicalOrders().');
        return null;
      }
      const cc = new window.CanonicalCore();
      await cc.load();
      this._canonicalCore = cc;
      return cc;
    }

    _riskLevelFor(order, breachIds) {
      if (!breachIds.has(order.order_id)) return 'low';
      const breach = this.getSlaBreaches().find(b => b.order_id === order.order_id);
      return breach && breach.hours_over > 48 ? 'high' : 'medium';
    }

    /** Returns canonical-compliant records for every loaded order.
     *  Falls back to raw orders (unprocessed) if CanonicalCore isn't
     *  loaded, so callers can still function during partial rollout. */
    async getCanonicalOrders() {
      const cc = await this._canonical();
      if (!cc) return this.orders;

      const breaches = this.getSlaBreaches();
      const breachIds = new Set(breaches.map(b => b.order_id));
      const stage = id => this.stageIndex[id];

      return this.orders.map(o => {
        const s = stage(o.stage);
        const { record } = cc.process({
          id: o.order_id,
          type: 'o2c_order',
          vertical: 'o2c',
          owner: o.owner || 'Unassigned',
          status: s ? s.label : o.stage,
          current_stage: o.stage,
          risk_level: this._riskLevelFor(o, breachIds),
          sla_state: breachIds.has(o.order_id) ? 'breached' : 'on_track',
          linked_war_room: '/war-rooms/o2c/o2c-war-room.html',
          customer: o.customer,
          value: o.value,
          currency: o.currency,
          notes: o.notes || ''
        });
        return record;
      });
    }
  }"""
    patch_file(ENGINE_PATH, "O2CEngine canonical wiring", OLD_ENGINE, NEW_ENGINE,
               marker="Canonical core wiring")

    # 2. Load canonical-core.js before o2c-engine.js in the war room page.
    OLD_WARROOM = '<script src="/war-rooms/o2c/services/o2c-engine.js"></script>'
    NEW_WARROOM = ('<script src="/runtime/kernel/canonical-core.js"></script>\n'
                   '<script src="/war-rooms/o2c/services/o2c-engine.js"></script>')
    patch_file(WARROOM_PATH, "canonical-core.js script include", OLD_WARROOM, NEW_WARROOM)

    print("\n--- patch_o2c_canonical_wiring.py report ---")
    for msg, status in results:
        print(f"[{status}] {msg}")
    print("----------------------------------------------\n")

    if any(s == "FAIL" for _, s in results):
        sys.exit(1)

if __name__ == "__main__":
    main()