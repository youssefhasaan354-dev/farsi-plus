/*
# Ad placements table for admin-controlled ad settings
- admin can toggle each placement on/off
- public read (app needs to know which placements are active)
- admin write through RLS
*/

CREATE TABLE IF NOT EXISTS ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_placements_select_public" ON ad_placements;
CREATE POLICY "ad_placements_select_public" ON ad_placements FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "ad_placements_insert_admin" ON ad_placements;
CREATE POLICY "ad_placements_insert_admin" ON ad_placements FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "ad_placements_update_admin" ON ad_placements;
CREATE POLICY "ad_placements_update_admin" ON ad_placements FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "ad_placements_delete_admin" ON ad_placements;
CREATE POLICY "ad_placements_delete_admin" ON ad_placements FOR DELETE
  TO authenticated USING (is_admin());

INSERT INTO ad_placements (placement, enabled) VALUES
  ('home_banner', true),
  ('lesson_complete', true),
  ('result_screen', true),
  ('sidebar_desktop', true)
ON CONFLICT (placement) DO NOTHING;
