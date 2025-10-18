-- Recreate the monitoring view that was dropped
CREATE OR REPLACE VIEW push_trigger_stats AS
SELECT 
    'deliveries' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE date >= CURRENT_DATE) as today
FROM deliveries
WHERE produktivitaet_stops > 0

UNION ALL

SELECT 
    'payroll_amounts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
FROM payroll_amounts

UNION ALL

SELECT 
    'extra_rides' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
FROM extra_rides;

SELECT 'Monitoring view recreated!' as status;