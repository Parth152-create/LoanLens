package com.loanlens.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class LoanRequest {

    @NotNull(message = "Revolving utilization is required")          // ← ADDED
    @DecimalMin(value = "0.0", message = "Must be between 0 and 1") // ← ADDED
    @DecimalMax(value = "1.0", message = "Must be between 0 and 1") // ← ADDED
    public Double revolvingUtilization;

    @NotNull(message = "Age is required")                            // ← ADDED
    @Min(value = 18, message = "Must be at least 18")               // ← ADDED
    @Max(value = 100, message = "Must be 100 or below")             // ← ADDED
    public Integer age;

    @NotNull(message = "Number of late payments (30-59) is required") // ← ADDED
    @Min(value = 0, message = "Cannot be negative")                   // ← ADDED
    @Max(value = 50, message = "Value seems too high")                // ← ADDED
    public Integer numTimesLate3059;

    @NotNull(message = "Debt ratio is required")                     // ← ADDED
    @DecimalMin(value = "0.0", message = "Cannot be negative")       // ← ADDED
    public Double debtRatio;

    @NotNull(message = "Monthly income is required")                 // ← ADDED
    @DecimalMin(value = "0.0", message = "Cannot be negative")       // ← ADDED
    public Double monthlyIncome;

    @NotNull(message = "Number of open credit lines is required")    // ← ADDED
    @Min(value = 0, message = "Cannot be negative")                  // ← ADDED
    @Max(value = 100, message = "Value seems too high")              // ← ADDED
    public Integer numOpenCreditLines;

    @NotNull(message = "Number of late payments (90+) is required")  // ← ADDED
    @Min(value = 0, message = "Cannot be negative")                  // ← ADDED
    @Max(value = 50, message = "Value seems too high")               // ← ADDED
    public Integer numTimesLate90;

    @NotNull(message = "Number of real estate loans is required")    // ← ADDED
    @Min(value = 0, message = "Cannot be negative")                  // ← ADDED
    @Max(value = 50, message = "Value seems too high")               // ← ADDED
    public Integer numRealEstateLoans;

    @NotNull(message = "Number of late payments (60-89) is required") // ← ADDED
    @Min(value = 0, message = "Cannot be negative")                   // ← ADDED
    @Max(value = 50, message = "Value seems too high")                // ← ADDED
    public Integer numTimesLate6089;

    @NotNull(message = "Number of dependents is required")           // ← ADDED
    @Min(value = 0, message = "Cannot be negative")                  // ← ADDED
    @Max(value = 20, message = "Value seems too high")               // ← ADDED
    public Integer numDependents;
}
