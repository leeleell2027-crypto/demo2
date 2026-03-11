package com.example.demo2.model;

import java.util.List;
import java.time.LocalDateTime;

public class CategoryItem {
    private Long id;
    private Long parentId;
    private String name;
    private boolean isChecked;
    private int sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // For hierarchical display
    private List<CategoryItem> children;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean isChecked() { return isChecked; }
    public void setChecked(boolean checked) { isChecked = checked; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<CategoryItem> getChildren() { return children; }
    public void setChildren(List<CategoryItem> children) { this.children = children; }
}
