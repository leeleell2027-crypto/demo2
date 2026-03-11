package com.example.demo2.controller;

import com.example.demo2.model.CategoryItem;
import com.example.demo2.service.CategoryItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/category-items")
public class CategoryItemController {

    @Autowired
    private CategoryItemService categoryItemService;

    @GetMapping("/tree")
    public ResponseEntity<List<CategoryItem>> getTree() {
        return ResponseEntity.ok(categoryItemService.getTree());
    }

    @PostMapping
    public ResponseEntity<Void> createItem(@RequestBody CategoryItem item) {
        categoryItemService.createItem(item);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateItem(@PathVariable Long id, @RequestBody CategoryItem item) {
        item.setId(id);
        categoryItemService.updateItem(item);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        categoryItemService.deleteItem(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/checked")
    public ResponseEntity<Void> updateChecked(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        Boolean isChecked = payload.get("isChecked");
        if (isChecked != null) {
            categoryItemService.updateChecked(id, isChecked);
        }
        return ResponseEntity.ok().build();
    }
}
