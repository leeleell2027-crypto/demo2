package com.example.demo2.model;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

  private Long stockId;

  private Long productId;

  private Long optionId;

  private Integer quantity;

  private Integer safetyStock;

  private LocalDateTime updatedAt;
}




