package com.loanlens.backend.controller;

import com.loanlens.backend.dto.LoanApplicationResponse;
import com.loanlens.backend.dto.LoanRequest;
import com.loanlens.backend.model.LoanApplication;
import com.loanlens.backend.service.LoanApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class LoanApplicationController {

    private final LoanApplicationService service;

    public LoanApplicationController(LoanApplicationService service) {
        this.service = service;
    }

    // ── POST /api/loans — evaluate ────────────────────────────
    @PostMapping
    public ResponseEntity<LoanApplicationResponse> evaluate(
            @Valid @RequestBody LoanRequest request) {
        LoanApplication result = service.evaluate(request);
        return ResponseEntity.ok(LoanApplicationResponse.from(result));
    }

    // ── GET /api/loans/{id} ───────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<LoanApplicationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(LoanApplicationResponse.from(service.getById(id)));
    }

    // ── GET /api/loans — all (no pagination, kept for frontend) ──
    @GetMapping
    public ResponseEntity<List<LoanApplicationResponse>> getAll() {
        List<LoanApplicationResponse> all = service.getAll()
            .stream().map(LoanApplicationResponse::from).toList();
        return ResponseEntity.ok(all);
    }

    // ── GET /api/loans/paged?page=0&size=10&sort=createdAt,desc ──
    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getPaged(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "10")   int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LoanApplication> result = service.getPaged(pageable);

        return ResponseEntity.ok(Map.of(
            "content",       result.getContent().stream().map(LoanApplicationResponse::from).toList(),
            "page",          result.getNumber(),
            "size",          result.getSize(),
            "totalElements", result.getTotalElements(),
            "totalPages",    result.getTotalPages(),
            "last",          result.isLast()
        ));
    }
}