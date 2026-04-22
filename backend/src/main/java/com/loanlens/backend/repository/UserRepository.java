// ============================================================
// FILE 4 OF 8 — Item 5: JWT Auth
// LOCATION: /Users/parth/IdeaProjects/LoanLens/backend/src/main/java/com/loanlens/backend/repository/UserRepository.java
// ACTION: CREATE this file — it does not exist yet
// ============================================================

package com.loanlens.backend.repository;

import com.loanlens.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}