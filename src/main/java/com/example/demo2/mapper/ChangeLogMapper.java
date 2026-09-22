package com.example.demo2.mapper;

import com.example.demo2.model.ChangeLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChangeLogMapper {
    int insert(ChangeLog log);
}


