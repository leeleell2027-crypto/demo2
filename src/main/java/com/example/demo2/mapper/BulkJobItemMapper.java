package com.example.demo2.mapper;

import com.example.demo2.model.BulkJobItem;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface BulkJobItemMapper {
    List<BulkJobItem> findByJobIdOrderByRowNoAsc(Long jobId);
    int insert(BulkJobItem item);
    int update(BulkJobItem item);
}


