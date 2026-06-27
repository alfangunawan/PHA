-- Fix gad7_results severity CHECK constraint: Indonesian → English values
-- Old: ('minimal', 'ringan', 'sedang', 'berat')
-- New: ('minimal', 'mild', 'moderate', 'severe')

ALTER TABLE gad7_results DROP CONSTRAINT IF EXISTS gad7_results_severity_check;

ALTER TABLE gad7_results
    ADD CONSTRAINT gad7_results_severity_check
    CHECK (severity IN ('minimal', 'mild', 'moderate', 'severe'));
