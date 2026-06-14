/*
  # Fix sessions INSERT RLS policy

  ## Change
  Replaces the unrestricted `WITH CHECK (true)` INSERT policy with a
  constrained version that validates the row has meaningful content.

  ## Security
  - INSERT is permitted for any caller (anonymous included, since this app
    has no auth) but only when the new row satisfies:
      - `title` is a non-empty string
      - `steps` is a non-null JSON value
    This prevents trivially empty / junk rows while keeping the app working
    for its intended anonymous-use flow.
  - SELECT policy is unchanged.
*/

DROP POLICY IF EXISTS "Anyone can create sessions" ON sessions;

CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (
    title IS NOT NULL AND length(trim(title)) > 0
    AND steps IS NOT NULL
  );
