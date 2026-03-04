package com.example.demo2.controller;

import com.example.demo2.model.Transaction;
import com.example.demo2.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public List<Transaction> getTransactions() {
        return transactionService.getAllTransactions();
    }
}
