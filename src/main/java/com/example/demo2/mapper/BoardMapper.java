package com.example.demo2.mapper;

import com.example.demo2.model.Board;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BoardMapper {
    List<Board> findAll(@Param("limit") int limit, @Param("offset") int offset);

    int insert(Board board);

    Board findById(Long id);

    int countAll();
}
