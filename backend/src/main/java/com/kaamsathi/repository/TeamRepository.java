package com.kaamsathi.repository;

import com.kaamsathi.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByNameIgnoreCase(String name);
}
