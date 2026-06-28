-- CreateTable
CREATE TABLE IF NOT EXISTS homework_item (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  origin_session_id  TEXT NOT NULL,
  problem_num        INT  NOT NULL DEFAULT 1,
  content            TEXT NOT NULL,
  type               TEXT NOT NULL DEFAULT 'one_off'
                       CHECK (type IN ('one_off','ongoing')),
  status             TEXT NOT NULL DEFAULT 'assigned'
                       CHECK (status IN ('assigned','partial','done','not_done','dropped')),
  last_reviewed_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_hw_user_status ON homework_item (user_id, status);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_hw_origin ON homework_item (origin_session_id);
