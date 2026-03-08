package com.example.demo2.controller;

import com.example.demo2.model.UpbitTickerDto;
import com.example.demo2.service.UpbitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/coin")
@RequiredArgsConstructor
public class CoinStatusController {

    private final UpbitService upbitService;

    @GetMapping("/top5")
    public List<UpbitTickerDto> getTop5() {
        return upbitService.getTop5VolumedCoins();
    }
}
