package com.example.demo2.service;

import com.example.demo2.mapper.ScheduleMapper;
import com.example.demo2.model.Schedule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleMapper scheduleMapper;

    public List<Schedule> getSchedulesByMember(String memberName) {
        return scheduleMapper.findByMemberName(memberName);
    }

    public void addSchedule(Schedule schedule) {
        scheduleMapper.insert(schedule);
    }

    public void deleteSchedule(Long id) {
        scheduleMapper.delete(id);
    }
}
