package com.example.demo2.mapper;

import com.example.demo2.model.Board;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BoardMapper {
    List<Board> findAll(@Param("limit") int limit, @Param("offset") int offset,
            @Param("searchTitle") String searchTitle,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate,
            @Param("category1") String category1,
            @Param("category2") String category2,
            @Param("category3") String category3);

    int insert(Board board);

    Board findById(Long id);

    int countAll(@Param("searchTitle") String searchTitle,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate,
            @Param("category1") String category1,
            @Param("category2") String category2,
            @Param("category3") String category3);

    int update(Board board);

    int delete(Long id);
}
