package com.example.demo2.mapper;

import com.example.demo2.model.Holiday;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HolidayMapper {
    List<Holiday> findAll();

    int count();

    List<Holiday> findPaged(@Param("offset") int offset, @Param("size") int size);

    Holiday findById(Integer id);

    int insert(Holiday holiday);

    int update(Holiday holiday);

    int delete(Integer id);
}
