package com.example.demo2.mapper;

import com.example.demo2.model.Member;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface MemberMapper {
    List<Member> findAll();

    Member findById(String id);

    Member findByUsername(String username);

    int count();

    List<Member> findWithPagination(@Param("offset") int offset, @Param("limit") int limit);

    int insert(Member member);

    int update(Member member);

    int delete(String id);
}
