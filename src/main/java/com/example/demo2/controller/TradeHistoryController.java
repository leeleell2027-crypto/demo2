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
    public ResponseEntity<List<Map<String, Object>>> getBtcMarketHistory() {
        return ResponseEntity.ok(tradeHistoryService.getBtcMarketHistory());
    }

    @PutMapping("/btc-market/{id}")
    public ResponseEntity<?> updateBtcPrice(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String price = payload.get("price");
        tradeHistoryService.updateBtcPrice(id, price);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/btc-market/sync")
    public ResponseEntity<?> syncBtcPricesFromUpbit() {
        tradeHistoryService.syncBtcPricesFromUpbit();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadTradeHistory(@RequestParam("file") MultipartFile file) {
        try {
            tradeHistoryService.uploadTradeHistory(file);
            return ResponseEntity.ok(Map.of("message", "파일이 성공적으로 업로드되었습니다.", "success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), "success", false));
        }
    }

    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllTradeHistories() {
        try {
            tradeHistoryService.truncateTradeHistory();
            return ResponseEntity.ok(Map.of("message", "모든 거래 내역이 삭제되었습니다.", "success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "삭제 중 오류가 발생했습니다.", "success", false));
        }
    }
}
