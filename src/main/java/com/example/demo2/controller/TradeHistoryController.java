package com.example.demo2.controller;

import com.example.demo2.service.TradeHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trade-history")
public class TradeHistoryController {

    @Autowired
    private TradeHistoryService tradeHistoryService;

    @GetMapping
    public ResponseEntity<?> getTradeHistories(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String coin,
            @RequestParam(required = false) String side) {
        return ResponseEntity.ok(tradeHistoryService.getTradeHistories(page, size, startDate, endDate, coin, side));
    }

    @GetMapping("/coins")
    public ResponseEntity<List<String>> getUniqueCoins() {
        return ResponseEntity.ok(tradeHistoryService.getUniqueCoins());
    }

    @GetMapping("/stats")
    public ResponseEntity<List<Map<String, Object>>> getStatsByDate(
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String coin,
            @RequestParam(required = false) String side,
            @RequestParam(required = false, defaultValue = "false") Boolean includeBtc) {
        return ResponseEntity.ok(tradeHistoryService.getStatsByDate(endDate, coin, side, includeBtc));
    }

    @GetMapping("/btc-market")
    public ResponseEntity<List<Map<String, Object>>> getBtcMarketHistory(
            @RequestParam(required = false, defaultValue = "BTC") String coin) {
        return ResponseEntity.ok(tradeHistoryService.getBtcMarketHistory(coin));
    }

    @PutMapping("/btc-market/{id}")
    public ResponseEntity<?> updateBtcPrice(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String price = payload.get("price");
        tradeHistoryService.updateBtcPrice(id, price);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/btc-market/sync")
    public ResponseEntity<?> syncBtcPricesFromUpbit(
            @RequestParam(required = false, defaultValue = "BTC") String coin,
            @RequestParam(required = false) String date) {
        if (date != null && !date.trim().isEmpty()) {
            // 특정 날짜만 동기화
            tradeHistoryService.syncCoinPriceForDate(coin, date.trim());
            return ResponseEntity.ok(Map.of("message", coin + " " + date + " 시세 등록 완료", "success", true));
        }
        tradeHistoryService.syncCoinPricesFromUpbit(coin);
        return ResponseEntity.ok(Map.of("message", coin + " 시세 동기화 완료", "success", true));
    }

    @PostMapping("/btc-market/sync-all")
    public ResponseEntity<?> syncAllCoinPricesFromUpbit() {
        tradeHistoryService.syncAllCoinPricesFromUpbit();
        return ResponseEntity.ok(Map.of("message", "전체 코인 시세 동기화 완료", "success", true));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadTradeHistory(@RequestParam("file") MultipartFile file) {
        try {
            tradeHistoryService.uploadTradeHistory(file);
            return ResponseEntity.ok(Map.of("message", "?뚯씪???깃났?곸쑝濡??낅줈?쒕릺?덉뒿?덈떎.", "success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "?뚯씪 ?낅줈??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎: " + e.getMessage(), "success", false));
        }
    }

    @GetMapping("/raw-list")
    public ResponseEntity<List<com.example.demo2.model.TradeHistory>> getAllFilteredTradeHistories(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String coin,
            @RequestParam(required = false) String side) {
        return ResponseEntity.ok(tradeHistoryService.getAllFilteredTradeHistories(startDate, endDate, coin, side));
    }

    @GetMapping("/grouped")
    public ResponseEntity<List<com.example.demo2.model.TradeGroupSummaryDto>> getGroupedTradeHistories(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String coin,
            @RequestParam(required = false) String side,
            @RequestParam(defaultValue = "orderedAt") String window) {
        return ResponseEntity.ok(tradeHistoryService.getGroupedTradeHistories(startDate, endDate, coin, side, window));
    }

    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllTradeHistories() {
        try {
            tradeHistoryService.truncateTradeHistory();
            return ResponseEntity.ok(Map.of("message", "紐⑤뱺 嫄곕옒 ?댁뿭????젣?섏뿀?듬땲??", "success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.", "success", false));
        }
    }
}
