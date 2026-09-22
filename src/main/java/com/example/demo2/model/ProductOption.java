package com.example.demo2.model;

import lombok.*;

import java.time.LocalDateTime;

import static com.example.demo2.model.Enums.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductOption {

  private Long optionId;

  private Long productId;

  private String optionKey;

  private String optionSku;

  private Integer optionPrice;

  private Boolean displayYn;

  private OptionSaleStatus saleStatus;

  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;
}




