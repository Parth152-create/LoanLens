package com.loanlens.backend.service;

import com.loanlens.backend.dto.LoanRequest;
import com.loanlens.backend.model.LoanApplication;
import com.loanlens.backend.model.Verdict;
import com.loanlens.backend.repository.LoanApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanApplicationServiceTest {

    @Mock
    private LoanApplicationRepository repository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private LoanApplicationService service;

    private LoanRequest validRequest;

    @BeforeEach
    void setUp() {
        // Inject mocked RestTemplate and ML URL
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(service, "mlServiceUrl", "http://localhost:8000");

        validRequest = new LoanRequest();
        validRequest.revolvingUtilization = 0.5;
        validRequest.age                  = 35;
        validRequest.numTimesLate3059     = 0;
        validRequest.debtRatio            = 0.3;
        validRequest.monthlyIncome        = 5000.0;
        validRequest.numOpenCreditLines   = 6;
        validRequest.numTimesLate90       = 0;
        validRequest.numRealEstateLoans   = 1;
        validRequest.numTimesLate6089     = 0;
        validRequest.numDependents        = 2;
    }

    // ── evaluate() ────────────────────────────────────────────

    @Test
    @DisplayName("evaluate() — LOW risk returns APPROVED verdict")
    void evaluate_lowRisk_returnsApproved() {
        Map<String, Object> mlResponse = Map.of(
            "default_probability", 0.10,
            "risk_tier",           "LOW",
            "message",             "Low risk of default.",
            "shap_values",         Map.of("age", -0.1)
        );
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenReturn(mlResponse);

        LoanApplication saved = new LoanApplication();
        saved.setId(1L);
        saved.setDefaultProbability(0.10);
        saved.setRiskTier("LOW");
        saved.setVerdict(Verdict.APPROVED);
        when(repository.save(any(LoanApplication.class))).thenReturn(saved);

        LoanApplication result = service.evaluate(validRequest);

        assertThat(result.getVerdict()).isEqualTo(Verdict.APPROVED);
        assertThat(result.getRiskTier()).isEqualTo("LOW");
        assertThat(result.getDefaultProbability()).isEqualTo(0.10);
        verify(repository, times(1)).save(any(LoanApplication.class));
    }

    @Test
    @DisplayName("evaluate() — MEDIUM risk returns REVIEW verdict")
    void evaluate_mediumRisk_returnsReview() {
        Map<String, Object> mlResponse = Map.of(
            "default_probability", 0.35,
            "risk_tier",           "MEDIUM",
            "message",             "Moderate risk of default.",
            "shap_values",         Map.of()
        );
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenReturn(mlResponse);

        LoanApplication saved = new LoanApplication();
        saved.setVerdict(Verdict.REVIEW);
        saved.setRiskTier("MEDIUM");
        when(repository.save(any(LoanApplication.class))).thenReturn(saved);

        LoanApplication result = service.evaluate(validRequest);

        assertThat(result.getVerdict()).isEqualTo(Verdict.REVIEW);
    }

    @Test
    @DisplayName("evaluate() — HIGH risk returns REJECTED verdict")
    void evaluate_highRisk_returnsRejected() {
        Map<String, Object> mlResponse = Map.of(
            "default_probability", 0.75,
            "risk_tier",           "HIGH",
            "message",             "High risk of default.",
            "shap_values",         Map.of()
        );
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenReturn(mlResponse);

        LoanApplication saved = new LoanApplication();
        saved.setVerdict(Verdict.REJECTED);
        saved.setRiskTier("HIGH");
        when(repository.save(any(LoanApplication.class))).thenReturn(saved);

        LoanApplication result = service.evaluate(validRequest);

        assertThat(result.getVerdict()).isEqualTo(Verdict.REJECTED);
    }

    @Test
    @DisplayName("evaluate() — SHAP values are mapped and saved")
    void evaluate_shapValuesAreMapped() {
        Map<String, Object> shap = Map.of("age", -0.12, "DebtRatio", 0.05);
        Map<String, Object> mlResponse = Map.of(
            "default_probability", 0.20,
            "risk_tier",           "LOW",
            "message",             "Low risk.",
            "shap_values",         shap
        );
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenReturn(mlResponse);

        when(repository.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplication result = service.evaluate(validRequest);

        assertThat(result.getShapValues()).isNotNull();
        assertThat(result.getShapValues()).containsKey("age");
        assertThat(result.getShapValues()).containsKey("DebtRatio");
    }

    @Test
    @DisplayName("evaluate() — null SHAP values handled gracefully")
    void evaluate_nullShapValues_handledGracefully() {
        Map<String, Object> mlResponse = new java.util.HashMap<>();
        mlResponse.put("default_probability", 0.20);
        mlResponse.put("risk_tier", "LOW");
        mlResponse.put("message", "Low risk.");
        mlResponse.put("shap_values", null);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenReturn(mlResponse);
        when(repository.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplication result = service.evaluate(validRequest);

        assertThat(result.getShapValues()).isNull();
    }

    @Test
    @DisplayName("evaluate() — ML service failure throws exception")
    void evaluate_mlServiceFailure_throwsException() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
            .thenThrow(new RuntimeException("ML service unavailable"));

        assertThatThrownBy(() -> service.evaluate(validRequest))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("ML service unavailable");

        verify(repository, never()).save(any());
    }

    // ── getAll() ──────────────────────────────────────────────

    @Test
    @DisplayName("getAll() — returns all loans from repository")
    void getAll_returnsAllLoans() {
        LoanApplication l1 = new LoanApplication(); l1.setId(1L);
        LoanApplication l2 = new LoanApplication(); l2.setId(2L);
        when(repository.findAll()).thenReturn(List.of(l1, l2));

        List<LoanApplication> result = service.getAll();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(LoanApplication::getId).containsExactly(1L, 2L);
    }

    @Test
    @DisplayName("getAll() — returns empty list when no loans exist")
    void getAll_emptyRepository_returnsEmptyList() {
        when(repository.findAll()).thenReturn(List.of());

        List<LoanApplication> result = service.getAll();

        assertThat(result).isEmpty();
    }

    // ── getById() ─────────────────────────────────────────────

    @Test
    @DisplayName("getById() — returns loan when found")
    void getById_found_returnsLoan() {
        LoanApplication loan = new LoanApplication();
        loan.setId(1L);
        loan.setRiskTier("HIGH");
        when(repository.findById(1L)).thenReturn(Optional.of(loan));

        LoanApplication result = service.getById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getRiskTier()).isEqualTo("HIGH");
    }

    @Test
    @DisplayName("getById() — throws RuntimeException when not found")
    void getById_notFound_throwsException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("99");
    }
}