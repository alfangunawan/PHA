-- CreateTable
CREATE TABLE conversations (
    id          SERIAL PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    cbt_phase   TEXT DEFAULT 'ventilasi',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- CreateIndex
CREATE INDEX idx_conv_session ON conversations(session_id);

-- CreateIndex
CREATE INDEX idx_conv_user_created ON conversations(user_id, created_at DESC);

-- CreateTable
CREATE TABLE gad7_results (
    id          SERIAL PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    score       INTEGER NOT NULL CHECK (score >= 0 AND score <= 21),
    severity    TEXT NOT NULL CHECK (severity IN ('minimal', 'ringan', 'sedang', 'berat')),
    answers     JSONB,
    taken_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CreateIndex
CREATE INDEX idx_gad7_user_taken ON gad7_results(user_id, taken_at DESC);

-- CreateTable
CREATE TABLE chatbot_session_state (
    session_id                TEXT PRIMARY KEY,
    user_id                   TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    current_phase             TEXT NOT NULL DEFAULT 'ventilasi',
    problem_count             INTEGER NOT NULL DEFAULT 0,
    active_problem_num        INTEGER NOT NULL DEFAULT 1,
    deferred_problem_summary  TEXT,
    phase_turn_count          INTEGER NOT NULL DEFAULT 0,
    homework_log              JSONB NOT NULL DEFAULT '[]'::jsonb,
    session_complete          BOOLEAN NOT NULL DEFAULT false,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
