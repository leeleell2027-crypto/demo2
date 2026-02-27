package com.example.demo2.mapper;

import com.example.demo2.model.Schedule;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ScheduleMapper {
    List<Schedule> findByMemberName(String memberName);

    int insert(Schedule schedule);

    int delete(Long id);
}
