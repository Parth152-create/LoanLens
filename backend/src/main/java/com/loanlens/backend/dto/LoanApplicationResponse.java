// ============================================================
// FILE: LoanApplicationResponse.java
// LOCATION: /Users/parth/IdeaProjects/LoanLens/backend/src/main/java/com/loanlens/backend/dto/LoanApplicationResponse.java
// CHANGES:
//   1. Added  public String verdict;          ← ADDED field
//   2. Added  r.verdict = ...                 ← ADDED in from()
//   Everything else is IDENTICAL to your original
// ============================================================

package com.loanlens.backend.dto;

import com.loanlens.backend.model.LoanApplication;
import java.time.LocalDateTime;
import java.util.Map;

public class LoanApplicationResponse {
    public Long id;
    public double revolvingUtilization;
    public int age;
    public double debtRatio;
    public double monthlyIncome;
    public double defaultProbability;
    public String riskTier;
    public String verdict;                          // ← ADDED
    public String message;
    public LocalDateTime createdAt;
    public Map<String, Double> shapValues;

    public static LoanApplicationResponse from(LoanApplication loan) {
        LoanApplicationResponse r = new LoanApplicationResponse();
        r.id                   = loan.getId();
        r.revolvingUtilization = loan.getRevolvingUtilization();
        r.age                  = loan.getAge();
        r.debtRatio            = loan.getDebtRatio();
        r.monthlyIncome        = loan.getMonthlyIncome();
        r.defaultProbability   = loan.getDefaultProbability();
        r.riskTier             = loan.getRiskTier();
        r.verdict              = loan.getVerdict() != null   // ← ADDED
                                     ? loan.getVerdict().name()
                                     : null;
        r.message              = loan.getMessage();
        r.createdAt            = loan.getCreatedAt();
        r.shapValues           = loan.getShapValues();
        return r;
    }
}