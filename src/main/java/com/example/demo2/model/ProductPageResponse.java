package com.example.demo2.model;

import java.util.List;

public class ProductPageResponse {
    private List<ProductDtos.ProductListItem> products;
    private int totalCount;
    private int totalPages;
    private int currentPage;

    public ProductPageResponse(List<ProductDtos.ProductListItem> products, int totalCount, int totalPages, int currentPage) {
        this.products = products;
        this.totalCount = totalCount;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
    }

    // Getters and Setters
    public List<ProductDtos.ProductListItem> getProducts() {
        return products;
    }

    public void setProducts(List<ProductDtos.ProductListItem> products) {
        this.products = products;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }
}
