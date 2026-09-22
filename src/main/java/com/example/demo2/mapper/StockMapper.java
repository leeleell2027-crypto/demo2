package com.example.demo2.mapper;

import com.example.demo2.model.Stock;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Optional;

@Mapper
public interface StockMapper {
    Optional<Stock> findById(Long stockId);
    List<Stock> findByProductId(Long productId);
    Optional<Stock> findByOptionId(Long optionId);
    int insert(Stock stock);
    int update(Stock stock);
}


