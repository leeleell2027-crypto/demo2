package com.example.demo2.service;

import com.example.demo2.model.UpbitTickerDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UpbitService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<UpbitTickerDto> getTop5VolumedCoins() {
        try {
            // 1. Fetch all markets
            String marketUrl = "https://api.upbit.com/v1/market/all";
            String marketResponse = restTemplate.getForObject(marketUrl, String.class);
            List<Map<String, String>> allMarkets = objectMapper.readValue(marketResponse,
                    new TypeReference<List<Map<String, String>>>() {
                    });

            if (allMarkets == null)
                return Collections.emptyList();

            // 2. Filter KRW markets and create a map of market -> korean_name
            Map<String, String> krwMarketNames = allMarkets.stream()
                    .filter(m -> m.get("market").startsWith("KRW-"))
                    .collect(Collectors.toMap(m -> m.get("market"), m -> m.get("korean_name")));

            String marketsQuery = String.join(",", krwMarketNames.keySet());

            // 3. Fetch tickers for KRW markets
            String tickerUrl = "https://api.upbit.com/v1/ticker?markets=" + marketsQuery;
            String tickerResponse = restTemplate.getForObject(tickerUrl, String.class);

            List<UpbitTickerDto> tickers = objectMapper.readValue(tickerResponse,
                    new TypeReference<List<UpbitTickerDto>>() {
                    });

            // 4. Set korean names and sort by volume
            return tickers.stream()
                    .peek(t -> t.setKoreanName(krwMarketNames.get(t.getMarket())))
                    .sorted(Comparator.comparing(UpbitTickerDto::getAccTradePrice24h).reversed())
                    .limit(5)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error fetching Upbit data", e);
            return Collections.emptyList();
        }
    }
}
