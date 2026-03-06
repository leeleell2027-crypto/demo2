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

    public List<TradeHistory> getAllTradeHistories() {
        return tradeHistoryMapper.getAllTradeHistories();
    }

    public List<String> getUniqueCoins() {
        return tradeHistoryMapper.getUniqueCoins();
    }

    public List<Map<String, Object>> getStatsByDate(String endDate, String coin, String side, Boolean includeBtc) {
        return tradeHistoryMapper.getStatsByDate(endDate, coin, side, includeBtc);
    }

    public List<Map<String, Object>> getBtcMarketHistory() {
        return tradeHistoryMapper.getBtcMarketHistory();
    }

    public void updateBtcPrice(Long id, String price) {
        tradeHistoryMapper.updateBtcPrice(id, price);
    }

    public void syncBtcPricesFromUpbit() {
        List<Map<String, Object>> histories = tradeHistoryMapper.getBtcMarketHistory();
        if (histories.isEmpty())
            return;

        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        String url = "https://api.upbit.com/v1/candles/days?market=KRW-BTC&count=200";

        try {
            org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>> typeRef = new org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>>() {
            };
            org.springframework.http.ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, null, typeRef);
            List<Map<String, Object>> candles = response.getBody();

            if (candles == null)
                return;

            for (Map<String, Object> history : histories) {
                Long id = ((Number) history.get("id")).longValue();
                String date = (String) history.get("date");

                for (Map<String, Object> candle : candles) {
                    String candleDate = ((String) candle.get("candle_date_time_kst")).split("T")[0];
                    if (date.equals(candleDate)) {
                        double high = ((Number) candle.get("high_price")).doubleValue();
                        double low = ((Number) candle.get("low_price")).doubleValue();
                        long avgPrice = Math.round((high + low) / 2.0);
                        tradeHistoryMapper.updateBtcPrice(id, String.valueOf(avgPrice));
                        break;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
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
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.");
        }
    }

    private void processCsvFile(MultipartFile file) throws Exception {
        try (BufferedReader fileReader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
                CSVParser csvParser = new CSVParser(fileReader,
                        CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            List<TradeHistory> tradeHistories = new ArrayList<>();
            // 체결시간,코인,마켓,종류,거래수량,거래단가,거래금액,수수료,정산금액,주문시간

            for (CSVRecord csvRecord : csvParser) {
                // Determine headers or just rely on indices if headers don't strictly match
                // For safety and compatibility, we can read by index if the format is fixed,
                // but usually using headers is better. Assuming standard upbit/bithumb CSV or
                // custom fixed format.

                TradeHistory history = new TradeHistory();
                // Usually headers are exact strings like "체결시간"
                // To be robust, if headers might slightly differ, we parse by index or try to
                // map.
                // Assuming standard
                // "체결시간","코인","마켓","종류","거래수량","거래단가","거래금액","수수료","정산금액","주문시간"

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
}
