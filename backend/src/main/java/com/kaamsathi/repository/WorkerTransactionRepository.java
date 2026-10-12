package com.kaamsathi.repository;

import com.kaamsathi.model.WorkerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface WorkerTransactionRepository extends JpaRepository<WorkerTransaction, Long> {
    List<WorkerTransaction> findByWorkerIdOrderByTransactionDateDescIdDesc(Long workerId);
    List<WorkerTransaction> findAllByOrderByTransactionDateDescIdDesc();
    List<WorkerTransaction> findByTransactionDateBetween(LocalDate from, LocalDate to);
}
