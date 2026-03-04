package com.example.demo2.service;

import com.example.demo2.mapper.TransactionMapper;
import com.example.demo2.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionMapper transactionMapper;

    public List<Transaction> getAllTransactions() {
        return transactionMapper.findAll();
    }

    public void createTransaction(Transaction transaction) {
        transactionMapper.insert(transaction);
    }
}
