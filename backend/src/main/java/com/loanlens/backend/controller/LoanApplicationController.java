package com.loanlens.backend.controller;

import com.loanlens.backend.dto.LoanApplicationResponse;
import com.loanlens.backend.dto.LoanRequest;
import com.loanlens.backend.service.LoanApplicationService;
import com.loanlens.backend.model.LoanApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin(origins = {"http://localhost:3000"})
public class LoanApplicationController {

    private final LoanApplicationService service;

    public LoanApplicationController(LoanApplicationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LoanApplicationResponse> evaluate(@RequestBody LoanRequest request) {
        LoanApplication result = service.evaluate(request);
        return ResponseEntity.ok(LoanApplicationResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanApplicationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(LoanApplicationResponse.from(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<List<LoanApplicationResponse>> getAll() {
        List<LoanApplicationResponse> all = service.getAll()
            .stream().map(LoanApplicationResponse::from).toList();
        return ResponseEntity.ok(all);
    }
}
