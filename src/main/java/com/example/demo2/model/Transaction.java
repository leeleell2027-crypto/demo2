package com.example.demo2.model;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Transaction {
    private Integer id;
    private LocalDate date;
    private String time;
    private String card;
    private String merchant;
    private BigDecimal amountKrw;
    private BigDecimal amountUsd;
    private String paymentMethod;
    private String merchantInfo;
    private BigDecimal discount;
    private BigDecimal points;
    private String status;
    private LocalDate dueDate;
    private String approvalNo;
    private LocalDateTime createdAt;
}
