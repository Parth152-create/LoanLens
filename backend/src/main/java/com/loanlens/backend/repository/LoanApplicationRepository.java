package com.loanlens.backend.repository;

import com.loanlens.backend.model.LoanApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    // JpaRepository already provides findAll(Pageable) — no extra code needed
    Page<LoanApplication> findAll(Pageable pageable);
}