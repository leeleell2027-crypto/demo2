package com.example.demo2.model;

import lombok.*;

import java.time.LocalDateTime;

import static com.example.demo2.model.Enums.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

  private Long productId;

  private String productCode;

  private String productName;

  private Long brandId;

  private Long supplierId;

  private TaxType taxType;

  private SaleStatus saleStatus;

  private Boolean displayYn;

  private Integer listPrice;

  private Integer salePrice;

  private Boolean stockManageYn;

  private Integer totalStock;

  private Integer safetyStock;

  private String thumbImageUrl;

  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;
}




