package com.example.demo2.model;

import lombok.Data;

@Data
public class TradeHistory {
    private Long id;
    private String executedAt; // 泥닿껐?쒓컙
    private String coin; // 肄붿씤
    private String market; // 留덉폆
    private String side; // 醫낅쪟
    private String quantity; // 嫄곕옒?섎웾
    private String price; // 嫄곕옒?④?
    private String totalAmount; // 嫄곕옒湲덉븸
    private String fee; // ?섏닔猷?
    private String settlementAmount; // ?뺤궛湲덉븸
    private String orderedAt; // 二쇰Ц?쒓컙
}


