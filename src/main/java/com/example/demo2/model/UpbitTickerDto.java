package com.example.demo2.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpbitTickerDto {
    private String market;

    @JsonProperty("trade_price")
    private Double tradePrice;

    @JsonProperty("acc_trade_price_24h")
    private Double accTradePrice24h;

    @JsonProperty("signed_change_rate")
    private Double signedChangeRate;

    @JsonProperty("signed_change_price")
    private Double signedChangePrice;

    @JsonProperty("high_price")
    private Double highPrice;

    @JsonProperty("low_price")
    private Double lowPrice;

    private String koreanName;
}
