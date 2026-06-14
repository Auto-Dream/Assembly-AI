/*
  # Create AssembleAI Sessions Table

  ## Overview
  Stores assembly guide sessions generated from uploaded manuals.

  ## New Tables
  - `sessions`
    - `id` (uuid, primary key) - Unique session identifier
    - `title` (text) - Guide title extracted from manual
    - `language` (text) - Language code (en, es, fr, de, zh, ja)
    - `interpretation` (text) - AI's textual interpretation of the manual
    - `steps` (jsonb) - Array of structured assembly steps
    - `prompt_used` (text) - The AI prompt used for generation
    - `thumbnail_data` (text) - Base64 thumbnail image of the first frame
    - `created_at` (timestamptz) - When the session was created

  ## Security
  - RLS enabled with public read/insert access (no auth required for this app)
  - Users can read all sessions (for session history)
  - Anyone can create sessions
  - No deletion allowed from frontend
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Assembly Guide',
  language text NOT NULL DEFAULT 'en',
  interpretation text DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]',
  prompt_used text DEFAULT '',
  thumbnail_data text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);
