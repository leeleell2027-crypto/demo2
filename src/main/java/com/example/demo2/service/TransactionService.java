package com.example.demo2.service;

import com.example.demo2.mapper.TransactionMapper;
import com.example.demo2.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class TransactionService {

    @Autowired
    private TransactionMapper transactionMapper;

    public List<Transaction> getAllTransactions() {
        return transactionMapper.findAll();
    }

    public Map<String, Object> getPagedTransactions(int page, int size, String searchDate, String searchMerchant,
            String startDate, String endDate) {
        int offset = (page - 1) * size;
        List<Transaction> transactions = transactionMapper.findPaged(offset, size, searchDate, searchMerchant,
                startDate, endDate);
        int total = transactionMapper.count(searchDate, searchMerchant, startDate, endDate);
        int totalPages = (int) Math.ceil((double) total / size);
        Map<String, Object> stats = transactionMapper.getSearchStatistics(searchDate, searchMerchant, startDate,
                endDate);

        Map<String, Object> result = new HashMap<>();
        result.put("transactions", transactions);
        result.put("total", total);
        result.put("totalPages", totalPages);
        result.put("currentPage", page);
        result.put("searchStats", stats);
        return result;
    }

    public void createTransaction(Transaction transaction) {
        transactionMapper.insert(transaction);
    }
}
