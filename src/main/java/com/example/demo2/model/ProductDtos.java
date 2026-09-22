package com.example.demo2.model;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class ProductDtos {

    public record ProductListItem(
            Long productId,
            String productCode,
            String productName,
            Enums.SaleStatus saleStatus,
            Boolean displayYn,
            Integer listPrice,
            Integer salePrice,
            Integer totalStock,
            LocalDateTime updatedAt) {
    }

    public record ProductDetail(
            Long productId,
            String productCode,
            String productName,
            Enums.TaxType taxType,
            Enums.SaleStatus saleStatus,
            Boolean displayYn,
            Integer listPrice,
            Integer salePrice,
            Boolean stockManageYn,
            Integer totalStock,
            Integer safetyStock,
            String thumbImageUrl,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<OptionItem> options,
            List<StockItem> stocks) {
    }

    public record OptionItem(
            Long optionId,
            String optionKey,
            String optionSku,
            Integer optionPrice,
            Boolean displayYn,
            Enums.OptionSaleStatus saleStatus) {
    }

    public record StockItem(
            Long stockId,
            Long optionId,
            Integer quantity,
            Integer safetyStock) {
    }

    public record ProductUpsertRequest(
            @NotBlank @Size(max = 40) String productCode,
            @NotBlank @Size(max = 200) String productName,
            Enums.TaxType taxType,
            Enums.SaleStatus saleStatus,
            @NotNull Boolean displayYn,
            @NotNull @Min(0) Integer listPrice,
            @NotNull @Min(0) Integer salePrice,
            @NotNull Boolean stockManageYn,
            Integer totalStock,
            Integer safetyStock,
            @Size(max = 500) String thumbImageUrl,
            List<OptionUpsert> options,
            List<StockUpsert> stocks) {
        @AssertTrue(message = "salePrice must be <= listPrice")
        public boolean isPriceValid() {
            if (listPrice == null || salePrice == null)
                return true;
            return salePrice <= listPrice;
        }
    }

    public record OptionUpsert(
            Long optionId,
            @NotBlank @Size(max = 200) String optionKey,
            @Size(max = 50) String optionSku,
            @NotNull @Min(0) Integer optionPrice,
            @NotNull Boolean displayYn,
            @NotNull Enums.OptionSaleStatus saleStatus) {
    }

    public record StockUpsert(
            Long stockId,
            Long optionId,
            @NotNull Integer quantity,
            Integer safetyStock) {
    }

    public record PatchDisplayRequest(@NotNull Boolean displayYn, String reason) {
    }

    public record PatchStatusRequest(@NotNull Enums.SaleStatus saleStatus, String reason) {
    }
}
