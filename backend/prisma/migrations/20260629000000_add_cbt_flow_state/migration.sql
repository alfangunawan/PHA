-- ============================================================================
-- MIGRASI: Model "CBT Flow" (banyak flow per session/window chat)
-- Jalankan SEBELUM import workflow baru. Idempotent (aman dijalankan ulang).
-- Kolom lama (problem_count, active_problem_num, deferred_problem_summary) TIDAK
-- di-drop di sini — workflow baru berhenti memakainya; DROP dilakukan terpisah
-- SETELAH workflow flow terverifikasi (pola sama dengan homework_log).
-- ============================================================================
BEGIN;

-- 1) Tabel state per-flow (satu masalah = satu flow) --------------------------
CREATE TABLE IF NOT EXISTS chatbot_flow_state (
  flow_id          TEXT PRIMARY KEY,         -- skema: <session_id>__f<flow_num>
  session_id       TEXT NOT NULL,
  user_id          TEXT NOT NULL,
  problem_topic    TEXT,                     -- NULL sampai ditangkap di identifikasi; immutable setelah terisi
  flow_num         INT  NOT NULL,
  current_phase    TEXT NOT NULL DEFAULT 'ventilasi',
  phase_turn_count INT  NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','pending','deferred','complete')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_session ON chatbot_flow_state(session_id, flow_num);

-- INVARIANT KERAS: maksimal SATU flow 'active' per session_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_flow_one_active
  ON chatbot_flow_state(session_id) WHERE status = 'active';

-- 2) chatbot_session_state: kolom mesin inter-flow ----------------------------
ALTER TABLE chatbot_session_state ADD COLUMN IF NOT EXISTS active_flow_id TEXT;
ALTER TABLE chatbot_session_state ADD COLUMN IF NOT EXISTS session_status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_session_status') THEN
    ALTER TABLE chatbot_session_state
      ADD CONSTRAINT chk_session_status
      CHECK (session_status IN ('active','awaiting_problem_decision','awaiting_coda','closed'));
  END IF;
END $$;

-- 3) conversations: atribusi pesan ke flow ------------------------------------
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS flow_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conv_flow ON conversations(flow_id);

-- 4) homework_item: PR milik masalah, bukan window ----------------------------
ALTER TABLE homework_item ADD COLUMN IF NOT EXISTS origin_flow_id TEXT;
CREATE INDEX IF NOT EXISTS idx_hw_flow ON homework_item(origin_flow_id);

COMMIT;

-- ============================================================================
-- (JANGAN dijalankan sekarang) Pembersihan kolom lama — SETELAH workflow final:
-- ALTER TABLE chatbot_session_state DROP COLUMN IF EXISTS problem_count;
-- ALTER TABLE chatbot_session_state DROP COLUMN IF EXISTS active_problem_num;
-- ALTER TABLE chatbot_session_state DROP COLUMN IF EXISTS deferred_problem_summary;
-- ============================================================================
