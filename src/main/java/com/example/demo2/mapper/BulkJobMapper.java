package com.example.demo2.mapper;

import com.example.demo2.model.BulkJob;
import org.apache.ibatis.annotations.Mapper;
import java.util.Optional;

@Mapper
public interface BulkJobMapper {
    Optional<BulkJob> findById(Long jobId);
    int insert(BulkJob job);
    int update(BulkJob job);
}


