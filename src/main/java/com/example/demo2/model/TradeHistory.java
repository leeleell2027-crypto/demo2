package com.example.demo2.model;

import lombok.Data;

@Data
public class TradeHistory {
    private Long id;
    private String executedAt; // 체결시간
    private String coin; // 코인
    private String market; // 마켓
    private String side; // 종류
    private String quantity; // 거래수량
    private String price; // 거래단가
    private String totalAmount; // 거래금액
    private String fee; // 수수료
    private String settlementAmount; // 정산금액
    private String orderedAt; // 주문시간
}
