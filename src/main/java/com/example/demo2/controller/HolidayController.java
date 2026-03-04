package com.example.demo2.controller;

import com.example.demo2.model.Holiday;
import com.example.demo2.service.HolidayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    @Autowired
    private HolidayService holidayService;

    @GetMapping("/all")
    public List<Holiday> getHolidays() {
        return holidayService.getAllHolidays();
    }

    @GetMapping("/paged")
    public Map<String, Object> getPagedHolidays(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        return holidayService.getPagedHolidays(page, size);
    }

    @PostMapping
    public void addHoliday(@RequestBody Holiday holiday) {
        holidayService.saveHoliday(holiday);
    }

    @PutMapping
    public void editHoliday(@RequestBody Holiday holiday) {
        holidayService.saveHoliday(holiday);
    }

    @DeleteMapping("/{id}")
    public void deleteHoliday(@PathVariable("id") Integer id) {
        holidayService.removeHoliday(id);
    }
}
