package com.kaamsathi.repository;

import com.kaamsathi.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findFirstByUsernameAndRoleAndActiveTrue(String username, String role);
    Optional<Account> findFirstByPhoneAndRoleAndActiveTrue(String phone, String role);
    List<Account> findByActiveTrueOrderByIdAsc();
    boolean existsByWorkerIdAndIdNot(Long workerId, Long accountId);
}
