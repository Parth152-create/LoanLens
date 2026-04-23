package com.loanlens.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loanlens.backend.model.LoanApplication;
import com.loanlens.backend.model.Verdict;
import com.loanlens.backend.security.JwtFilter;
import com.loanlens.backend.security.JwtUtil;
import com.loanlens.backend.service.LoanApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = LoanApplicationController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtFilter.class)
)
class LoanApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LoanApplicationService service;

    @MockitoBean
    private JwtUtil jwtUtil;

    private LoanApplication sampleLoan;
    private Map<String, Object> validRequestBody;

    @BeforeEach
    void setUp() {
        sampleLoan = new LoanApplication();
        sampleLoan.setId(1L);
        sampleLoan.setAge(35);
        sampleLoan.setMonthlyIncome(5000.0);
        sampleLoan.setDebtRatio(0.3);
        sampleLoan.setRevolvingUtilization(0.5);
        sampleLoan.setDefaultProbability(0.15);
        sampleLoan.setRiskTier("LOW");
        sampleLoan.setVerdict(Verdict.APPROVED);
        sampleLoan.setMessage("Low risk of default.");
        sampleLoan.setCreatedAt(LocalDateTime.now());

        validRequestBody = Map.of(
            "revolvingUtilization", 0.5,
            "age",                  35,
            "numTimesLate3059",     0,
            "debtRatio",            0.3,
            "monthlyIncome",        5000.0,
            "numOpenCreditLines",   6,
            "numTimesLate90",       0,
            "numRealEstateLoans",   1,
            "numTimesLate6089",     0,
            "numDependents",        2
        );
    }

    // ── POST /api/loans ───────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("POST /api/loans — valid request returns 200 with response")
    void evaluate_validRequest_returns200() throws Exception {
        when(service.evaluate(any())).thenReturn(sampleLoan);

        mockMvc.perform(post("/api/loans")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequestBody)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.riskTier").value("LOW"))
            .andExpect(jsonPath("$.verdict").value("APPROVED"))
            .andExpect(jsonPath("$.defaultProbability").value(0.15));
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/loans — age below 18 returns 400")
    void evaluate_ageTooLow_returns400() throws Exception {
        Map<String, Object> invalidBody = Map.of(
            "revolvingUtilization", 0.5,
            "age",                  15,
            "numTimesLate3059",     0,
            "debtRatio",            0.3,
            "monthlyIncome",        5000.0,
            "numOpenCreditLines",   6,
            "numTimesLate90",       0,
            "numRealEstateLoans",   1,
            "numTimesLate6089",     0,
            "numDependents",        2
        );

        mockMvc.perform(post("/api/loans")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidBody)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/loans — missing required field returns 400")
    void evaluate_missingField_returns400() throws Exception {
        Map<String, Object> incompleteBody = Map.of(
            "age", 35,
            "monthlyIncome", 5000.0
        );

        mockMvc.perform(post("/api/loans")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(incompleteBody)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/loans — unauthenticated returns 401 or 403")
    void evaluate_unauthenticated_returns401or403() throws Exception {
        mockMvc.perform(post("/api/loans")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequestBody)))
            .andExpect(status().is(org.hamcrest.Matchers.anyOf(
                org.hamcrest.Matchers.is(401),
                org.hamcrest.Matchers.is(403)
            )));
    }

    // ── GET /api/loans ────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("GET /api/loans — returns list of all loans")
    void getAll_returnsLoanList() throws Exception {
        LoanApplication loan2 = new LoanApplication();
        loan2.setId(2L);
        loan2.setRiskTier("HIGH");
        loan2.setVerdict(Verdict.REJECTED);
        loan2.setDefaultProbability(0.8);

        when(service.getAll()).thenReturn(List.of(sampleLoan, loan2));

        mockMvc.perform(get("/api/loans"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[1].id").value(2))
            .andExpect(jsonPath("$[1].verdict").value("REJECTED"));
    }

    @Test
    @WithMockUser
    @DisplayName("GET /api/loans — empty list returns empty array")
    void getAll_emptyList_returnsEmptyArray() throws Exception {
        when(service.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/loans"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    // ── GET /api/loans/{id} ───────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("GET /api/loans/{id} — found returns 200")
    void getById_found_returns200() throws Exception {
        when(service.getById(1L)).thenReturn(sampleLoan);

        mockMvc.perform(get("/api/loans/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.age").value(35))
            .andExpect(jsonPath("$.riskTier").value("LOW"));
    }

    @Test
    @WithMockUser
    @DisplayName("GET /api/loans/{id} — not found returns 404")
    void getById_notFound_returns404() throws Exception {
        when(service.getById(99L))
            .thenThrow(new RuntimeException("Loan application not found: 99"));

        mockMvc.perform(get("/api/loans/99"))
            .andExpect(status().isNotFound());
    }
}