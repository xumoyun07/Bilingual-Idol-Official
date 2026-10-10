-- =============================================================================
--  BILC - проверка целостности схемы и прав.
--  Запуск: sh docker/scripts/verify.sh
--
--  ВАЖНО: в схеме нет FOREIGN KEY (0 ограничений), поэтому ссылочная
--  целостность проверяется явными orphan-запросами ниже. Если появится
--  ненулевой результат — в БД есть записи-сироты.
-- =============================================================================

SELECT 'схема' AS section, CONCAT('таблиц: ', COUNT(*)) AS result
FROM information_schema.tables WHERE table_schema = DATABASE()
UNION ALL
SELECT 'схема', CONCAT('FK-ограничений: ', COUNT(*))
FROM information_schema.table_constraints
WHERE table_schema = DATABASE() AND constraint_type = 'FOREIGN KEY'
UNION ALL
SELECT 'схема', CONCAT('индексов: ', COUNT(*))
FROM (SELECT DISTINCT table_name, index_name FROM information_schema.statistics
      WHERE table_schema = DATABASE()) t
UNION ALL
SELECT 'схема', CONCAT('роли приложения: ', GROUP_CONCAT(user ORDER BY user))
FROM mysql.user WHERE user LIKE 'bilc%';

SELECT '--- ссылочная целостность (должно быть 0) ---' AS section;

SELECT 'enrollments -> users' AS relation, COUNT(*) AS orphans
FROM enrollments e LEFT JOIN users u ON u.id = e.userId WHERE u.id IS NULL
UNION ALL
SELECT 'enrollments -> programs', COUNT(*)
FROM enrollments e LEFT JOIN programs p ON p.id = e.programId WHERE p.id IS NULL
UNION ALL
SELECT 'userProfileValues -> users', COUNT(*)
FROM userProfileValues v LEFT JOIN users u ON u.id = v.userId WHERE u.id IS NULL
UNION ALL
SELECT 'userProfileValues -> userFormFields', COUNT(*)
FROM userProfileValues v LEFT JOIN userFormFields f ON f.id = v.fieldId WHERE f.id IS NULL
UNION ALL
SELECT 'userFormFields -> userFormSections', COUNT(*)
FROM userFormFields f LEFT JOIN userFormSections s ON s.id = f.sectionId WHERE s.id IS NULL
UNION ALL
SELECT 'studentProfiles -> users', COUNT(*)
FROM studentProfiles sp LEFT JOIN users u ON u.id = sp.userId WHERE u.id IS NULL
UNION ALL
SELECT 'attendanceRecords -> classSessions', COUNT(*)
FROM attendanceRecords a LEFT JOIN classSessions c ON c.id = a.classSessionId WHERE c.id IS NULL
UNION ALL
SELECT 'grades -> classSessions', COUNT(*)
FROM grades g LEFT JOIN classSessions c ON c.id = g.classSessionId WHERE c.id IS NULL
UNION ALL
SELECT 'applications -> users', COUNT(*)
FROM applications a LEFT JOIN users u ON u.id = a.userId WHERE u.id IS NULL;
