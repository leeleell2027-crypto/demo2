package com.example.demo2.service;

import com.example.demo2.mapper.CategoryItemMapper;
import com.example.demo2.model.CategoryItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryItemService {

    @Autowired
    private CategoryItemMapper categoryItemMapper;

    public List<CategoryItem> getTree() {
        List<CategoryItem> allItems = categoryItemMapper.findAll();
        Map<Long, CategoryItem> itemMap = new HashMap<>();
        List<CategoryItem> roots = new ArrayList<>();

        // Initialize and put into map
        for (CategoryItem item : allItems) {
            item.setChildren(new ArrayList<>());
            itemMap.put(item.getId(), item);
        }

        // Build tree
        for (CategoryItem item : allItems) {
            if (item.getParentId() == null) {
                roots.add(item);
            } else {
                CategoryItem parent = itemMap.get(item.getParentId());
                if (parent != null) {
                    parent.getChildren().add(item);
                }
            }
        }

        return roots;
    }

    @Transactional
    public void createItem(CategoryItem item) {
        categoryItemMapper.insert(item);
    }

    @Transactional
    public void updateItem(CategoryItem item) {
        categoryItemMapper.update(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        categoryItemMapper.delete(id);
    }

    @Transactional
    public void updateChecked(Long id, boolean isChecked) {
        categoryItemMapper.updateChecked(id, isChecked);
    }
}
