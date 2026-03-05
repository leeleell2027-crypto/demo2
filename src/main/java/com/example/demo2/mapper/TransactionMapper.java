package com.example.demo2.mapper;

import com.example.demo2.model.Transaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface TransactionMapper {

    List<Transaction> findAll();

    int count(@Param("searchDate") String searchDate, @Param("searchMerchant") String searchMerchant,
            @Param("startDate") String startDate, @Param("endDate") String endDate);

    List<Transaction> findPaged(@Param("offset") int offset, @Param("size") int size,
            @Param("searchDate") String searchDate, @Param("searchMerchant") String searchMerchant,
            @Param("startDate") String startDate, @Param("endDate") String endDate);

    int insert(Transaction transaction);

    java.util.Map<String, Object> getSearchStatistics(@Param("searchDate") String searchDate,
            @Param("searchMerchant") String searchMerchant,
            @Param("startDate") String startDate, @Param("endDate") String endDate);
}
