package com.example.demo2.controller;

import com.example.demo2.model.Transaction;
import com.example.demo2.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public List<Transaction> getTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/paged")
    public Map<String, Object> getPagedTransactions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String searchDate,
            @RequestParam(required = false) String searchMerchant,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return transactionService.getPagedTransactions(page, size, searchDate, searchMerchant, startDate, endDate);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadTransactions(@RequestParam("file") MultipartFile file) {
        try {
            transactionService.uploadTransactions(file);
            return ResponseEntity.ok("File uploaded and processed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing file: " + e.getMessage());
        }
    }
}
