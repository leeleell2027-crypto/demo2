package com.example.demo2.model;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Holiday {
    private Integer id;
    private LocalDate holidayDate;
    private String name;
    private boolean recurring;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
