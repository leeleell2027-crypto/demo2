package com.example.demo2.service;

import com.example.demo2.mapper.HolidayMapper;
import com.example.demo2.model.Holiday;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HolidayService {

    @Autowired
    private HolidayMapper holidayMapper;

    public List<Holiday> getAllHolidays() {
        return holidayMapper.findAll();
    }

    public Map<String, Object> getPagedHolidays(int page, int size) {
        int offset = (page - 1) * size;
        List<Holiday> content = holidayMapper.findPaged(offset, size);
        int totalElements = holidayMapper.count();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("totalElements", totalElements);
        result.put("totalPages", totalPages);
        result.put("size", size);
        result.put("number", page);

        return result;
    }

    public void saveHoliday(Holiday holiday) {
        if (holiday.getId() == null) {
            holidayMapper.insert(holiday);
        } else {
            holidayMapper.update(holiday);
        }
    }

    public void removeHoliday(Integer id) {
        holidayMapper.delete(id);
    }
}
