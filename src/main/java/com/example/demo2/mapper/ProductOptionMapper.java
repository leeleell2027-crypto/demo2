package com.example.demo2.mapper;

import com.example.demo2.model.ProductOption;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Optional;

@Mapper
public interface ProductOptionMapper {
    Optional<ProductOption> findById(Long optionId);
    List<ProductOption> findByProductId(Long productId);
    Optional<ProductOption> findByOptionSku(String optionSku);
    int insert(ProductOption option);
    int update(ProductOption option);
}


