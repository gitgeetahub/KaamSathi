package com.kaamsathi.repository;

import com.kaamsathi.model.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkerRepository extends JpaRepository<Worker, Long> {
    List<Worker> findByActiveTrueOrderByIdAsc();
}
