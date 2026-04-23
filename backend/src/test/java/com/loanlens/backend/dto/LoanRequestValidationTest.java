package com.loanlens.backend.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class LoanRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private LoanRequest validRequest() {
        LoanRequest r = new LoanRequest();
        r.revolvingUtilization = 0.5;
        r.age                  = 35;
        r.numTimesLate3059     = 0;
        r.debtRatio            = 0.3;
        r.monthlyIncome        = 5000.0;
        r.numOpenCreditLines   = 6;
        r.numTimesLate90       = 0;
        r.numRealEstateLoans   = 1;
        r.numTimesLate6089     = 0;
        r.numDependents        = 2;
        return r;
    }

    @Test
    @DisplayName("Valid request has no violations")
    void validRequest_noViolations() {
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(validRequest());
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Age below 18 triggers violation")
    void age_below18_triggersViolation() {
        LoanRequest r = validRequest();
        r.age = 17;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("age"));
    }

    @Test
    @DisplayName("Age above 100 triggers violation")
    void age_above100_triggersViolation() {
        LoanRequest r = validRequest();
        r.age = 101;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("age"));
    }

    @Test
    @DisplayName("Revolving utilization above 1.0 triggers violation")
    void revolvingUtilization_above1_triggersViolation() {
        LoanRequest r = validRequest();
        r.revolvingUtilization = 1.5;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("revolvingUtilization"));
    }

    @Test
    @DisplayName("Negative monthly income triggers violation")
    void monthlyIncome_negative_triggersViolation() {
        LoanRequest r = validRequest();
        r.monthlyIncome = -100.0;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("monthlyIncome"));
    }

    @Test
    @DisplayName("Null required field triggers violation")
    void nullAge_triggersViolation() {
        LoanRequest r = validRequest();
        r.age = null;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("age"));
    }

    @Test
    @DisplayName("Negative dependents triggers violation")
    void negativeDependents_triggersViolation() {
        LoanRequest r = validRequest();
        r.numDependents = -1;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("numDependents"));
    }

    @Test
    @DisplayName("Multiple invalid fields returns multiple violations")
    void multipleInvalidFields_returnsMultipleViolations() {
        LoanRequest r = validRequest();
        r.age                  = 15;
        r.revolvingUtilization = 2.0;
        r.monthlyIncome        = -500.0;
        Set<ConstraintViolation<LoanRequest>> violations = validator.validate(r);
        assertThat(violations.size()).isGreaterThanOrEqualTo(3);
    }
}