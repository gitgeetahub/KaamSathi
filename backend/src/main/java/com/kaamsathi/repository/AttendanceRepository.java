package com.kaamsathi.repository;

import com.kaamsathi.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByWorkerIdOrderByWorkDateDesc(Long workerId);
    List<Attendance> findByWorkDate(LocalDate workDate);
    List<Attendance> findByWorkDateBetween(LocalDate from, LocalDate to);
    Optional<Attendance> findByWorkerIdAndWorkDate(Long workerId, LocalDate workDate);
}
