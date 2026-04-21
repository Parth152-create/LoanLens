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
    public String message;
    public LocalDateTime createdAt;
    public Map<String, Double> shapValues;          // ← new

    public static LoanApplicationResponse from(LoanApplication loan) {
        LoanApplicationResponse r = new LoanApplicationResponse();
        r.id                   = loan.getId();
        r.revolvingUtilization = loan.getRevolvingUtilization();
        r.age                  = loan.getAge();
        r.debtRatio            = loan.getDebtRatio();
        r.monthlyIncome        = loan.getMonthlyIncome();
        r.defaultProbability   = loan.getDefaultProbability();
        r.riskTier             = loan.getRiskTier();
        r.message              = loan.getMessage();
        r.createdAt            = loan.getCreatedAt();
        r.shapValues           = loan.getShapValues();  // ← new
        return r;
    }
}