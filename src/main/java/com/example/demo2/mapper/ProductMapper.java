package com.example.demo2.mapper;

import com.example.demo2.model.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import com.example.demo2.model.Enums.SaleStatus;

@Mapper
public interface ProductMapper {
    Optional<Product> findById(Long productId);
    Optional<Product> findByProductCode(String productCode);
    List<Product> findAll(@Param("q") String q, @Param("qType") String qType, 
                        @Param("saleStatus") List<SaleStatus> saleStatus, 
                        @Param("displayYn") Boolean displayYn, 
                        @Param("fromDt") LocalDateTime fromDt, @Param("toDt") LocalDateTime toDt,
                        @Param("limit") int limit, @Param("offset") int offset);
    long countAll(@Param("q") String q, @Param("qType") String qType, 
                 @Param("saleStatus") List<SaleStatus> saleStatus, 
                 @Param("displayYn") Boolean displayYn, 
                 @Param("fromDt") LocalDateTime fromDt, @Param("toDt") LocalDateTime toDt);
    int insert(Product product);
    int update(Product product);
}


