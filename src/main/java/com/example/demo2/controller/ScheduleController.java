package com.example.demo2.controller;

import com.example.demo2.model.Schedule;
import com.example.demo2.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @GetMapping
    public List<Schedule> getSchedules(Principal principal) {
        if (principal == null)
            return null;
        return scheduleService.getSchedulesByMember(principal.getName());
    }

    @PostMapping
    public ResponseEntity<String> addSchedule(@RequestBody Schedule schedule, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        schedule.setMemberName(principal.getName());
        scheduleService.addSchedule(schedule);
        return ResponseEntity.ok("Schedule added");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSchedule(@PathVariable Long id, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        // Simple security check can be added here if needed to ensure the user owns the
        // schedule
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok("Schedule deleted");
    }
}
