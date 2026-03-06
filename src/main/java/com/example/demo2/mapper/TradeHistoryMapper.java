package com.example.demo2.mapper;

import com.example.demo2.model.TradeHistory;
import org.apache.ibatis.annotations.Mapper;

import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface TradeHistoryMapper {
    void insertTradeHistory(TradeHistory tradeHistory);

    List<TradeHistory> getAllTradeHistories();

    List<TradeHistory> getTradeHistories(
            @Param("startDate") String startDate,
            @Param("endDate") String endDate,
            @Param("coin") String coin,
            @Param("side") String side,
            @Param("offset") int offset,
            @Param("limit") int limit);

    int getTotalCount(
            @Param("startDate") String startDate,
            @Param("endDate") String endDate,
            @Param("coin") String coin,
            @Param("side") String side);

    List<String> getUniqueCoins();

    List<java.util.Map<String, Object>> getStatsByDate(
            @Param("endDate") String endDate,
            @Param("coin") String coin,
            @Param("side") String side,
            @Param("includeBtc") Boolean includeBtc);

    List<java.util.Map<String, Object>> getBtcMarketHistory();

    void updateBtcPrice(@Param("id") Long id, @Param("price") String price);

    void truncateTradeHistory();
}
