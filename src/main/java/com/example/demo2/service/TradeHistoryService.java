package com.example.demo2.service;

import com.example.demo2.mapper.TradeHistoryMapper;
import com.example.demo2.model.TradeHistory;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TradeHistoryService {

    @Autowired
    private TradeHistoryMapper tradeHistoryMapper;

    @Autowired
    private UpbitService upbitService;

    public List<TradeHistory> getAllTradeHistories() {
        return tradeHistoryMapper.getAllTradeHistories();
    }

    public List<String> getUniqueCoins() {
        return tradeHistoryMapper.getUniqueCoins();
    }

    public List<Map<String, Object>> getStatsByDate(String endDate, String coin, String side, Boolean includeBtc) {
        List<Map<String, Object>> stats = tradeHistoryMapper.getStatsByDate(endDate, coin, side, includeBtc);

        // Filter out "KRW"
        stats.removeIf(s -> "KRW".equals(s.get("coinName")));

        if (stats.isEmpty())
            return stats;

        // Fetch current prices from Upbit
        List<String> coinNames = stats.stream()
                .map(s -> (String) s.get("coinName"))
                .collect(java.util.stream.Collectors.toList());

        List<com.example.demo2.model.UpbitTickerDto> tickers = upbitService.getTickers(coinNames);
        Map<String, Double> priceMap = tickers.stream()
                .collect(java.util.stream.Collectors.toMap(
                        t -> t.getMarket().replace("KRW-", ""),
                        t -> t.getTradePrice()));

        // Add current price and valuation
        for (Map<String, Object> stat : stats) {
            String name = (String) stat.get("coinName");
            Double currentPrice = priceMap.get(name);
            Double totalQuantity = ((Number) stat.get("totalQuantity")).doubleValue();

            if (currentPrice != null) {
                stat.put("currentPrice", currentPrice);
                stat.put("currentValue", currentPrice * totalQuantity);
            } else {
                stat.put("currentPrice", 0.0);
                stat.put("currentValue", 0.0);
            }
        }

        return stats;
    }

    public static final List<String> SUPPORTED_COINS = List.of(
            "BTC", "ETH", "XRP", "SOL", "ADA", "XLM", "WLD", "HYPER", "ETC");

    public List<Map<String, Object>> getBtcMarketHistory() {
        return getBtcMarketHistory("BTC");
    }

    public List<Map<String, Object>> getBtcMarketHistory(String coin) {
        if (coin == null || coin.trim().isEmpty()) {
            coin = "BTC";
        }
        return tradeHistoryMapper.getBtcMarketHistory(coin.toUpperCase().trim());
    }

    public void updateBtcPrice(Long id, String price) {
        tradeHistoryMapper.updateBtcPrice(id, price);
    }

    public void syncBtcPricesFromUpbit() {
        syncCoinPricesFromUpbit("BTC");
    }

    public void syncCoinPricesFromUpbit(String coin) {
        if (coin == null || coin.trim().isEmpty() || "ALL".equalsIgnoreCase(coin.trim())) {
            syncAllCoinPricesFromUpbit();
            return;
        }
        syncSingleCoinPrices(coin.toUpperCase().trim());
    }

    // Upbit candles API URL 생성 (to 파라미터 올바른 URL 인코딩)
    private java.net.URI buildUpbitCandleUrl(String market, String targetDate) {
        return org.springframework.web.util.UriComponentsBuilder
                .fromHttpUrl("https://api.upbit.com/v1/candles/days")
                .queryParam("market", market)
                .queryParam("to", targetDate + " 23:59:59")
                .queryParam("count", 1)
                .build()
                .encode()
                .toUri();
    }

    // 가격 계산 헬퍼
    private long extractPrice(Map<String, Object> candle) {
        double high = candle.get("high_price") != null ? ((Number) candle.get("high_price")).doubleValue() : 0;
        double low = candle.get("low_price") != null ? ((Number) candle.get("low_price")).doubleValue() : 0;
        double tradePrice = candle.get("trade_price") != null ? ((Number) candle.get("trade_price")).doubleValue() : 0;
        if (high > 0 && low > 0) return Math.round((high + low) / 2.0);
        if (tradePrice > 0) return Math.round(tradePrice);
        return 0;
    }

    // 특정 날짜 1개만 동기화 (사용자가 직접 날짜 입력 시)
    public void syncCoinPriceForDate(String coin, String targetDate) {
        if (coin == null || coin.trim().isEmpty()) coin = "BTC";
        String upperCoin = coin.toUpperCase().trim();
        String market = "KRW-" + upperCoin;

        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        try {
            java.net.URI uri = buildUpbitCandleUrl(market, targetDate);
            org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>> typeRef =
                    new org.springframework.core.ParameterizedTypeReference<>() {};
            org.springframework.http.ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(uri, org.springframework.http.HttpMethod.GET, null, typeRef);
            List<Map<String, Object>> candles = response.getBody();

            if (candles != null && !candles.isEmpty()) {
                Map<String, Object> candle = candles.get(0);
                String candleDate = ((String) candle.get("candle_date_time_kst")).split("T")[0];
                long finalPrice = extractPrice(candle);

                // 날짜 일치 여부 관계없이 targetDate에 가격 저장 (오늘 등 장중 케이스 포함)
                if (!targetDate.equals(candleDate)) {
                    System.out.println("Date mismatch: requested=" + targetDate + ", returned=" + candleDate + ", saving price to targetDate");
                }
                tradeHistoryMapper.upsertBtcPrice(upperCoin, targetDate, String.valueOf(finalPrice));
            } else {
                System.out.println("No candle data returned for " + market + " at " + targetDate);
                tradeHistoryMapper.upsertBtcPrice(upperCoin, targetDate, "0");
            }
        } catch (Exception ex) {
            System.err.println("Error fetching candle for " + market + " at " + targetDate + ": " + ex.getMessage());
            ex.printStackTrace();
        }
    }

    public void syncAllCoinPricesFromUpbit() {
        for (String c : SUPPORTED_COINS) {
            try {
                syncSingleCoinPrices(c);
                Thread.sleep(200);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void syncSingleCoinPrices(String coin) {
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        String market = "KRW-" + coin;

        // "내가 등록된 날짜" (BTC에 등록된 고유 날짜들)만 가져와서 그 날짜의 금액만 Upbit에서 조회
        List<String> targetDates = tradeHistoryMapper.getBaseMarketDates();
        if (targetDates == null || targetDates.isEmpty()) {
            return;
        }

        for (String targetDate : targetDates) {
            try {
                java.net.URI uri = buildUpbitCandleUrl(market, targetDate);
                org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>> typeRef =
                        new org.springframework.core.ParameterizedTypeReference<>() {};
                org.springframework.http.ResponseEntity<List<Map<String, Object>>> response =
                        restTemplate.exchange(uri, org.springframework.http.HttpMethod.GET, null, typeRef);
                List<Map<String, Object>> candles = response.getBody();

                if (candles != null && !candles.isEmpty()) {
                    long finalPrice = extractPrice(candles.get(0));
                    tradeHistoryMapper.upsertBtcPrice(coin, targetDate, String.valueOf(finalPrice));
                } else {
                    tradeHistoryMapper.upsertBtcPrice(coin, targetDate, "0");
                }
                Thread.sleep(110); // Respect Upbit API rate limit
            } catch (Exception ex) {
                System.err.println("Error fetching candle for " + market + " at " + targetDate + ": " + ex.getMessage());
                try {
                    tradeHistoryMapper.upsertBtcPrice(coin, targetDate, "0");
                } catch (Exception ignored) {}
            }
        }
    }

    public Map<String, Object> getTradeHistories(int page, int size, String startDate, String endDate, String coin,
            String side) {
        if (startDate != null && !startDate.isEmpty() && !startDate.contains(" ")) {
            startDate = startDate + " 00:00:00";
        }
        if (endDate != null && !endDate.isEmpty() && !endDate.contains(" ")) {
            endDate = endDate + " 23:59:59";
        }

        int offset = (page - 1) * size;

        List<TradeHistory> content = tradeHistoryMapper.getTradeHistories(startDate, endDate, coin, side, offset, size);
        int totalElements = tradeHistoryMapper.getTotalCount(startDate, endDate, coin, side);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("currentPage", page);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("size", size);
        return response;
    }

    @Transactional
    public void uploadTradeHistory(MultipartFile file) throws Exception {
        String fileName = file.getOriginalFilename();
        if (fileName != null && (fileName.endsWith(".xls") || fileName.endsWith(".xlsx"))) {
            processExcelFile(file);
        } else if (fileName != null && fileName.endsWith(".csv")) {
            processCsvFile(file);
        } else {
            throw new IllegalArgumentException("IllegalArgumentException");
        }
    }

    private void processCsvFile(MultipartFile file) throws Exception {
        try (BufferedReader fileReader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
                CSVParser csvParser = new CSVParser(fileReader,
                        CSVFormat.DEFAULT.builder()
                                .setHeader()
                                .setSkipHeaderRecord(true)
                                .setIgnoreHeaderCase(true)
                                .setTrim(true)
                                .build())) {

            List<TradeHistory> tradeHistories = new ArrayList<>();

            for (CSVRecord csvRecord : csvParser) {
                // Determine headers or just rely on indices if headers don't strictly match
                // For safety and compatibility, we can read by index if the format is fixed,
                // but usually using headers is better. Assuming standard upbit/bithumb CSV or
                // custom fixed format.

                TradeHistory history = new TradeHistory();
                // Usually headers are exact strings like "泥닿껐?占쎄컙"
                // To be robust, if headers might slightly differ, we parse by index or try to
                // map.
                // Assuming standard
                if (csvRecord.size() >= 10) {
                    // Try to get by header name, fallback to index
                    try {
                        history.setExecutedAt(csvRecord.get("체결시간"));
                        history.setCoin(csvRecord.get("코인"));
                        history.setMarket(csvRecord.get("마켓"));
                        history.setSide(csvRecord.get("종류"));
                        history.setQuantity(csvRecord.get("거래수량"));
                        history.setPrice(csvRecord.get("거래단가"));
                        history.setTotalAmount(csvRecord.get("거래금액"));
                        history.setFee(csvRecord.get("수수료"));
                        history.setSettlementAmount(csvRecord.get("정산금액"));
                        history.setOrderedAt(csvRecord.get("주문시간"));
                    } catch (IllegalArgumentException e) {
                        // Header missed, use index formatting
                        history.setExecutedAt(csvRecord.get(0));
                        history.setCoin(csvRecord.get(1));
                        history.setMarket(csvRecord.get(2));
                        history.setSide(csvRecord.get(3));
                        history.setQuantity(csvRecord.get(4));
                        history.setPrice(csvRecord.get(5));
                        history.setTotalAmount(csvRecord.get(6));
                        history.setFee(csvRecord.get(7));
                        history.setSettlementAmount(csvRecord.get(8));
                        history.setOrderedAt(csvRecord.get(9));
                    }
                    tradeHistories.add(history);
                    tradeHistoryMapper.insertTradeHistory(history);
                }
            }
        }
    }

    private void processExcelFile(MultipartFile file) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                TradeHistory history = new TradeHistory();
                history.setExecutedAt(getCellValueAsString(row.getCell(0)));
                history.setCoin(getCellValueAsString(row.getCell(1)));
                history.setMarket(getCellValueAsString(row.getCell(2)));
                history.setSide(getCellValueAsString(row.getCell(3)));
                history.setQuantity(getCellValueAsString(row.getCell(4)));
                history.setPrice(getCellValueAsString(row.getCell(5)));
                history.setTotalAmount(getCellValueAsString(row.getCell(6)));
                history.setFee(getCellValueAsString(row.getCell(7)));
                history.setSettlementAmount(getCellValueAsString(row.getCell(8)));
                history.setOrderedAt(getCellValueAsString(row.getCell(0)));

                if (history.getExecutedAt() != null && !history.getExecutedAt().isEmpty()) {
                    tradeHistoryMapper.insertTradeHistory(history);
                }
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    java.util.Date date = cell.getDateCellValue();
                    return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date);
                } else {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    return cell.getStringCellValue();
                }
            default:
                return "";
        }
    }

    @Transactional
    public void truncateTradeHistory() {
        tradeHistoryMapper.truncateTradeHistory();
    }

    public List<TradeHistory> getAllFilteredTradeHistories(String startDate, String endDate, String coin, String side) {
        if (startDate != null && !startDate.isEmpty() && !startDate.contains(" ")) {
            startDate = startDate + " 00:00:00";
        }
        if (endDate != null && !endDate.isEmpty() && !endDate.contains(" ")) {
            endDate = endDate + " 23:59:59";
        }
        return tradeHistoryMapper.getTradeHistories(startDate, endDate, coin, side, 0, 0);
    }

    public List<com.example.demo2.model.TradeGroupSummaryDto> getGroupedTradeHistories(
            String startDate, String endDate, String coin, String side, String window) {
        List<TradeHistory> rawList = getAllFilteredTradeHistories(startDate, endDate, coin, side);
        if (rawList == null || rawList.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Sort chronologically ascending for clustering (earliest to latest)
        rawList.sort((a, b) -> {
            String timeA = a.getExecutedAt() != null ? a.getExecutedAt()
                    : (a.getOrderedAt() != null ? a.getOrderedAt() : "");
            String timeB = b.getExecutedAt() != null ? b.getExecutedAt()
                    : (b.getOrderedAt() != null ? b.getOrderedAt() : "");
            return timeA.compareTo(timeB);
        });

        long windowMillis = parseWindowToMillis(window);
        boolean isOrderedAtMode = "orderedAt".equalsIgnoreCase(window) || window == null || window.isEmpty();
        boolean isDayMode = "day".equalsIgnoreCase(window);
        boolean isAllMode = "all".equalsIgnoreCase(window);

        List<com.example.demo2.model.TradeGroupSummaryDto> groups = new ArrayList<>();

        for (TradeHistory th : rawList) {
            String coinName = th.getCoin() != null ? th.getCoin() : "";
            String market = th.getMarket() != null ? th.getMarket() : "";
            String s = th.getSide() != null ? th.getSide() : "";
            String orderedAt = th.getOrderedAt() != null ? th.getOrderedAt().trim() : "";
            String executedAt = th.getExecutedAt() != null ? th.getExecutedAt().trim() : orderedAt;

            double qty = parseDoubleSafe(th.getQuantity());
            double price = parseDoubleSafe(th.getPrice());
            double amount = parseDoubleSafe(th.getTotalAmount());
            if (amount <= 0 && qty > 0 && price > 0) {
                amount = qty * price;
            }
            double fee = parseDoubleSafe(th.getFee());
            double settlement = parseDoubleSafe(th.getSettlementAmount());
            if (settlement <= 0 && amount > 0) {
                settlement = amount;
            }

            long execMillis = parseDateToMillis(executedAt);
            com.example.demo2.model.TradeGroupSummaryDto matchedGroup = null;

            if (isAllMode) {
                for (com.example.demo2.model.TradeGroupSummaryDto g : groups) {
                    if (g.getCoin().equals(coinName) && g.getMarket().equals(market) && g.getSide().equals(s)) {
                        matchedGroup = g;
                        break;
                    }
                }
            } else if (isDayMode) {
                String dayKey = executedAt.length() >= 10 ? executedAt.substring(0, 10) : "";
                for (com.example.demo2.model.TradeGroupSummaryDto g : groups) {
                    String gDay = g.getFirstExecutedAt() != null && g.getFirstExecutedAt().length() >= 10
                            ? g.getFirstExecutedAt().substring(0, 10)
                            : "";
                    if (gDay.equals(dayKey) && g.getCoin().equals(coinName) && g.getMarket().equals(market)
                            && g.getSide().equals(s)) {
                        matchedGroup = g;
                        break;
                    }
                }
            } else if (isOrderedAtMode) {
                for (com.example.demo2.model.TradeGroupSummaryDto g : groups) {
                    if (g.getCoin().equals(coinName) && g.getMarket().equals(market) && g.getSide().equals(s)) {
                        if (!orderedAt.isEmpty() && orderedAt.equals(g.getOrderedAt())) {
                            matchedGroup = g;
                            break;
                        }
                    }
                }
            } else {
                for (int i = groups.size() - 1; i >= 0; i--) {
                    com.example.demo2.model.TradeGroupSummaryDto g = groups.get(i);
                    if (g.getCoin().equals(coinName) && g.getMarket().equals(market) && g.getSide().equals(s)) {
                        long lastExecMillis = parseDateToMillis(g.getLastExecutedAt());
                        if (Math.abs(execMillis - lastExecMillis) <= windowMillis) {
                            matchedGroup = g;
                            break;
                        }
                    }
                }
            }

            if (matchedGroup != null) {
                matchedGroup.setTradeCount(matchedGroup.getTradeCount() + 1);
                matchedGroup.setTotalQuantity(matchedGroup.getTotalQuantity() + qty);
                matchedGroup.setTotalAmount(matchedGroup.getTotalAmount() + amount);
                matchedGroup.setTotalFee(matchedGroup.getTotalFee() + fee);
                matchedGroup.setTotalSettlementAmount(matchedGroup.getTotalSettlementAmount() + settlement);
                if (price > 0) {
                    matchedGroup.setMinPrice(Math.min(matchedGroup.getMinPrice(), price));
                    matchedGroup.setMaxPrice(Math.max(matchedGroup.getMaxPrice(), price));
                }
                if (executedAt.compareTo(matchedGroup.getLastExecutedAt()) > 0) {
                    matchedGroup.setLastExecutedAt(executedAt);
                }
                if (executedAt.compareTo(matchedGroup.getFirstExecutedAt()) < 0) {
                    matchedGroup.setFirstExecutedAt(executedAt);
                }
                matchedGroup.getTrades().add(th);
            } else {
                com.example.demo2.model.TradeGroupSummaryDto newGroup = com.example.demo2.model.TradeGroupSummaryDto
                        .builder()
                        .id(java.util.UUID.randomUUID().toString())
                        .coin(coinName)
                        .market(market)
                        .side(s)
                        .orderedAt(orderedAt.isEmpty() ? executedAt : orderedAt)
                        .firstExecutedAt(executedAt)
                        .lastExecutedAt(executedAt)
                        .tradeCount(1)
                        .totalQuantity(qty)
                        .totalAmount(amount)
                        .totalFee(fee)
                        .totalSettlementAmount(settlement)
                        .minPrice(price)
                        .maxPrice(price)
                        .trades(new ArrayList<>(List.of(th)))
                        .build();
                groups.add(newGroup);
            }
        }

        for (com.example.demo2.model.TradeGroupSummaryDto g : groups) {
            if (g.getTotalQuantity() > 0) {
                g.setAvgPrice(g.getTotalAmount() / g.getTotalQuantity());
            } else {
                g.setAvgPrice(0.0);
            }
        }

        groups.sort((a, b) -> b.getLastExecutedAt().compareTo(a.getLastExecutedAt()));
        return groups;
    }

    private long parseWindowToMillis(String window) {
        if (window == null || window.isEmpty())
            return 0;
        String w = window.toLowerCase().trim();
        try {
            if (w.endsWith("s")) {
                return Long.parseLong(w.replace("s", "")) * 1000L;
            } else if (w.endsWith("m")) {
                return Long.parseLong(w.replace("m", "")) * 60 * 1000L;
            } else if (w.endsWith("h")) {
                return Long.parseLong(w.replace("h", "")) * 3600 * 1000L;
            } else if (w.endsWith("d")) {
                return Long.parseLong(w.replace("d", "")) * 86400 * 1000L;
            }
        } catch (Exception ignored) {
        }
        return 60 * 1000L;
    }

    private double parseDoubleSafe(String val) {
        if (val == null || val.trim().isEmpty())
            return 0.0;
        try {
            return Double.parseDouble(val.replace(",", "").trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private long parseDateToMillis(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty())
            return 0L;
        String cleaned = dateStr.trim().replace("T", " ");
        String[] patterns = {
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd HH:mm",
                "yyyy-MM-dd",
                "yyyy/MM/dd HH:mm:ss",
                "yyyy.MM.dd HH:mm:ss"
        };
        for (String p : patterns) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(p);
                sdf.setLenient(true);
                return sdf.parse(cleaned).getTime();
            } catch (Exception ignored) {
            }
        }
        return 0L;
    }
}
