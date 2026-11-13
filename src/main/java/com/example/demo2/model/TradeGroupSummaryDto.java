package com.example.demo2.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeGroupSummaryDto {
    private String id;
    private String coin;
    private String market;
    private String side;
    private String orderedAt;
    private String firstExecutedAt;
    private String lastExecutedAt;
    private int tradeCount;
    private double totalQuantity;
    private double totalAmount;
    private double avgPrice;
    private double totalFee;
    private double totalSettlementAmount;
    private double minPrice;
    private double maxPrice;
    @Builder.Default
    private List<TradeHistory> trades = new ArrayList<>();
}

