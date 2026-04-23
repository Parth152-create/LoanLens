package com.loanlens.backend.service;

import com.loanlens.backend.dto.LoanRequest;
import com.loanlens.backend.model.LoanApplication;
import com.loanlens.backend.model.Verdict;
import com.loanlens.backend.repository.LoanApplicationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LoanApplicationService {

    private final LoanApplicationRepository repository;
    private final RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public LoanApplicationService(LoanApplicationRepository repository) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
    }

    public LoanApplication evaluate(LoanRequest request) {
        // Build payload for ML service
        Map<String, Object> payload = new HashMap<>();
        payload.put("revolving_utilization", request.revolvingUtilization);
        payload.put("age", request.age);
        payload.put("num_times_late_30_59", request.numTimesLate3059);
        payload.put("debt_ratio", request.debtRatio);
        payload.put("monthly_income", request.monthlyIncome);
        payload.put("num_open_credit_lines", request.numOpenCreditLines);
        payload.put("num_times_late_90", request.numTimesLate90);
        payload.put("num_real_estate_loans", request.numRealEstateLoans);
        payload.put("num_times_late_60_89", request.numTimesLate6089);
        payload.put("num_dependents", request.numDependents);

        // Call FastAPI ML service
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(
            mlServiceUrl + "/predict", payload, Map.class
        );

        // Build entity
        LoanApplication loan = new LoanApplication();
        loan.setRevolvingUtilization(request.revolvingUtilization);
        loan.setAge(request.age);
        loan.setNumTimesLate3059(request.numTimesLate3059);
        loan.setDebtRatio(request.debtRatio);
        loan.setMonthlyIncome(request.monthlyIncome);
        loan.setNumOpenCreditLines(request.numOpenCreditLines);
        loan.setNumTimesLate90(request.numTimesLate90);
        loan.setNumRealEstateLoans(request.numRealEstateLoans);
        loan.setNumTimesLate6089(request.numTimesLate6089);
        loan.setNumDependents(request.numDependents);
        loan.setDefaultProbability((Double) response.get("default_probability"));
        loan.setRiskTier((String) response.get("risk_tier"));
        loan.setMessage((String) response.get("message"));

        // Derive verdict from riskTier
        String riskTier = (String) response.get("risk_tier");
        Verdict verdict = switch (riskTier != null ? riskTier.toUpperCase() : "") {
            case "LOW"    -> Verdict.APPROVED;
            case "MEDIUM" -> Verdict.REVIEW;
            default       -> Verdict.REJECTED;
        };
        loan.setVerdict(verdict);

        @SuppressWarnings("unchecked")
        Map<String, Object> rawShap = (Map<String, Object>) response.get("shap_values");
        if (rawShap != null) {
            Map<String, Double> shapValues = new HashMap<>();
            rawShap.forEach((k, v) -> shapValues.put(k, ((Number) v).doubleValue()));
            loan.setShapValues(shapValues);
        }

        return repository.save(loan);
    }

    // ── Get all (used by frontend getAll) ─────────────────────
    public List<LoanApplication> getAll() {
        return repository.findAll();
    }

    // ── Get by ID ─────────────────────────────────────────────
    public LoanApplication getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Loan application not found: " + id));
    }

    // ── Paginated (GET /api/loans/paged) ──────────────────────
    public Page<LoanApplication> getPaged(Pageable pageable) {
        return repository.findAll(pageable);
    }
}