package com.example.demo2.mapper;

import com.example.demo2.model.CategoryItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CategoryItemMapper {
    List<CategoryItem> findAll();
    List<CategoryItem> findByParentId(@Param("parentId") Long parentId);
    CategoryItem findById(@Param("id") Long id);
    void insert(CategoryItem item);
    void update(CategoryItem item);
    void delete(@Param("id") Long id);
    void updateChecked(@Param("id") Long id, @Param("isChecked") boolean isChecked);
}
