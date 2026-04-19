package com.loanlens.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_applications")
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double revolvingUtilization;
    private int age;
    private int numTimesLate3059;
    private double debtRatio;
    private double monthlyIncome;
    private int numOpenCreditLines;
    private int numTimesLate90;
    private int numRealEstateLoans;
    private int numTimesLate6089;
    private int numDependents;

    // ML result fields
    private double defaultProbability;
    private String riskTier;
    private String message;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public double getRevolvingUtilization() { return revolvingUtilization; }
    public void setRevolvingUtilization(double v) { this.revolvingUtilization = v; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public int getNumTimesLate3059() { return numTimesLate3059; }
    public void setNumTimesLate3059(int v) { this.numTimesLate3059 = v; }
    public double getDebtRatio() { return debtRatio; }
    public void setDebtRatio(double v) { this.debtRatio = v; }
    public double getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(double v) { this.monthlyIncome = v; }
    public int getNumOpenCreditLines() { return numOpenCreditLines; }
    public void setNumOpenCreditLines(int v) { this.numOpenCreditLines = v; }
    public int getNumTimesLate90() { return numTimesLate90; }
    public void setNumTimesLate90(int v) { this.numTimesLate90 = v; }
    public int getNumRealEstateLoans() { return numRealEstateLoans; }
    public void setNumRealEstateLoans(int v) { this.numRealEstateLoans = v; }
    public int getNumTimesLate6089() { return numTimesLate6089; }
    public void setNumTimesLate6089(int v) { this.numTimesLate6089 = v; }
    public int getNumDependents() { return numDependents; }
    public void setNumDependents(int v) { this.numDependents = v; }
    public double getDefaultProbability() { return defaultProbability; }
    public void setDefaultProbability(double v) { this.defaultProbability = v; }
    public String getRiskTier() { return riskTier; }
    public void setRiskTier(String v) { this.riskTier = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { this.message = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}