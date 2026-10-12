package com.kaamsathi.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class LegacySchemaMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    public LegacySchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (columnExists("attendance", "attendance_date") && !columnExists("attendance", "work_date")) {
            jdbc.execute("ALTER TABLE attendance CHANGE COLUMN attendance_date work_date DATE NOT NULL");
        }
        if (columnExists("attendance", "status")) {
            jdbc.update("""
                    UPDATE attendance
                    SET status = CASE UPPER(REPLACE(status, '-', '_'))
                        WHEN 'PRESENT' THEN 'Present'
                        WHEN 'ABSENT' THEN 'Absent'
                        WHEN 'LATE' THEN 'Late'
                        WHEN 'HALF_DAY' THEN 'Half-day'
                        ELSE status
                    END
                    """);
        }
        if (columnExists("workers", "full_name") && columnExists("workers", "name")) {
            jdbc.update("""
                    UPDATE workers
                    SET full_name = name
                    WHERE (full_name IS NULL OR TRIM(full_name) = '') AND name IS NOT NULL
                    """);
        }
        if (columnExists("workers", "is_active") && columnExists("workers", "active")) {
            jdbc.update("UPDATE workers SET is_active = active");
        }
        if (columnIsNotNullable("workers", "phone")) {
            jdbc.execute("ALTER TABLE workers MODIFY COLUMN phone VARCHAR(10) NULL");
        }
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
                """, Integer.class, table, column);
        return count != null && count > 0;
    }

    private boolean columnIsNotNullable(String table, String column) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = ?
                      AND column_name = ? AND is_nullable = 'NO'
                )
                """, Boolean.class, table, column));
    }
}
