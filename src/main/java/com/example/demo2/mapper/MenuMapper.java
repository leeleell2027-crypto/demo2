package com.example.demo2.mapper;

import com.example.demo2.model.Menu;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface MenuMapper {
    List<Menu> findAll();

    List<Menu> findAllActive();

    Menu findById(Integer id);

    int insert(Menu menu);

    int update(Menu menu);

    int delete(Integer id);
}
