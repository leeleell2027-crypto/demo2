package com.example.demo2.mapper;

import com.example.demo2.model.Transaction;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface TransactionMapper {

    List<Transaction> findAll();

    int insert(Transaction transaction);
}
