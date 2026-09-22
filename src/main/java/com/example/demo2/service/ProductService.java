package com.example.demo2.service;

import com.example.demo2.admin.Actor;
import com.example.demo2.model.Product;
import com.example.demo2.model.ProductOption;
import com.example.demo2.model.Stock;
import com.example.demo2.mapper.ProductOptionMapper;
import com.example.demo2.mapper.ProductMapper;
import com.example.demo2.mapper.StockMapper;
import com.example.demo2.model.ProductDtos;

import lombok.RequiredArgsConstructor;
import com.example.demo2.model.ProductPageResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static com.example.demo2.model.Enums.*;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductMapper productMapper;
  private final ProductOptionMapper optionMapper;
  private final StockMapper stockMapper;
  private final ChangeLogService changeLogService;

  public ProductPageResponse list(String q, String qType,
                                               List<SaleStatus> saleStatus,
                                               Boolean displayYn,
                                               LocalDate from, LocalDate to,
                                               int page, int size) {

    LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
    LocalDateTime toDt = to == null ? null : to.plusDays(1).atStartOfDay().minusNanos(1);

    int limit = size;
    int offset = page * size;

    List<Product> list = productMapper.findAll(q, qType, saleStatus, displayYn, fromDt, toDt, limit, offset);
    long total = productMapper.countAll(q, qType, saleStatus, displayYn, fromDt, toDt);

    List<ProductDtos.ProductListItem> items = list.stream()
        .map(p -> new ProductDtos.ProductListItem(
            p.getProductId(),
            p.getProductCode(),
            p.getProductName(),
            p.getSaleStatus(),
            p.getDisplayYn(),
            p.getListPrice(),
            p.getSalePrice(),
            p.getTotalStock(),
            p.getUpdatedAt()
        )).collect(Collectors.toList());

    int totalPages = (int) Math.ceil((double) total / size);

    return new ProductPageResponse(items, (int) total, totalPages, page);
  }

  public ProductDtos.ProductDetail detail(Long productId) {
    Product p = productMapper.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("product not found: " + productId));

    List<ProductOption> options = optionMapper.findByProductId(productId);
    List<Stock> stocks = stockMapper.findByProductId(productId);

    return new ProductDtos.ProductDetail(
        p.getProductId(), p.getProductCode(), p.getProductName(),
        p.getTaxType(), p.getSaleStatus(), p.getDisplayYn(),
        p.getListPrice(), p.getSalePrice(),
        p.getStockManageYn(), p.getTotalStock(), p.getSafetyStock(),
        p.getThumbImageUrl(), p.getCreatedAt(), p.getUpdatedAt(),
        options.stream().map(o -> new ProductDtos.OptionItem(
            o.getOptionId(), o.getOptionKey(), o.getOptionSku(), o.getOptionPrice(), o.getDisplayYn(), o.getSaleStatus()
        )).collect(Collectors.toList()),
        stocks.stream().map(s -> new ProductDtos.StockItem(
            s.getStockId(), s.getOptionId(), s.getQuantity(), s.getSafetyStock()
        )).collect(Collectors.toList())
    );
  }

  @Transactional
  public Long create(Actor actor, ProductDtos.ProductUpsertRequest req) {
    Product p = Product.builder()
        .productCode(req.productCode())
        .productName(req.productName())
        .taxType(req.taxType() == null ? TaxType.TAX : req.taxType())
        .saleStatus(req.saleStatus() == null ? SaleStatus.PENDING : req.saleStatus())
        .displayYn(req.displayYn())
        .listPrice(req.listPrice())
        .salePrice(req.salePrice())
        .stockManageYn(req.stockManageYn())
        .totalStock(req.totalStock())
        .safetyStock(req.safetyStock())
        .thumbImageUrl(req.thumbImageUrl())
        .build();

    productMapper.insert(p);
    Product saved = p;

    upsertOptionsAndStocks(saved.getProductId(), req);

    changeLogService.log(actor, ChangeTargetType.PRODUCT, saved.getProductId(), null,
        ChangeType.ETC, null, "{\"action\":\"create\"}", null);

    return saved.getProductId();
  }

  @Transactional
  public void update(Actor actor, Long productId, ProductDtos.ProductUpsertRequest req) {
    Product p = productMapper.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("product not found: " + productId));

    String before = String.format("{\"productName\":%s,\"listPrice\":%d,\"salePrice\":%d}",
        jsonString(p.getProductName()), p.getListPrice(), p.getSalePrice());

    p.setProductCode(req.productCode());
    p.setProductName(req.productName());
    p.setTaxType(req.taxType() == null ? p.getTaxType() : req.taxType());
    p.setSaleStatus(req.saleStatus() == null ? p.getSaleStatus() : req.saleStatus());
    p.setDisplayYn(req.displayYn());
    p.setListPrice(req.listPrice());
    p.setSalePrice(req.salePrice());
    p.setStockManageYn(req.stockManageYn());
    p.setTotalStock(req.totalStock());
    p.setSafetyStock(req.safetyStock());
    p.setThumbImageUrl(req.thumbImageUrl());

    productMapper.update(p);

    upsertOptionsAndStocks(productId, req);

    String after = String.format("{\"productName\":%s,\"listPrice\":%d,\"salePrice\":%d}",
        jsonString(p.getProductName()), p.getListPrice(), p.getSalePrice());

    changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null,
        ChangeType.ETC, before, after, null);
  }

  @Transactional
  public void patchDisplay(Actor actor, Long productId, Boolean displayYn, String reason) {
    Product p = productMapper.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("product not found: " + productId));

    String before = "{\"displayYn\":" + p.getDisplayYn() + "}";
    p.setDisplayYn(displayYn);
    productMapper.update(p);
    String after = "{\"displayYn\":" + p.getDisplayYn() + "}";

    changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null,
        ChangeType.DISPLAY, before, after, reason);
  }

  @Transactional
  public void patchStatus(Actor actor, Long productId, SaleStatus status, String reason) {
    Product p = productMapper.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("product not found: " + productId));

    String before = "{\"saleStatus\":\"" + p.getSaleStatus() + "\"}";
    p.setSaleStatus(status);
    productMapper.update(p);
    String after = "{\"saleStatus\":\"" + p.getSaleStatus() + "\"}";

    changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null,
        ChangeType.STATUS, before, after, reason);
  }

  private void upsertOptionsAndStocks(Long productId, ProductDtos.ProductUpsertRequest req) {
    // Simplified: upsert options by optionId (if null => create). Delete not handled in this POC.
    if (req.options() != null) {
      for (var o : req.options()) {
        ProductOption ent = o.optionId() == null ? new ProductOption() :
            optionMapper.findById(o.optionId()).orElse(new ProductOption());
        ent.setProductId(productId);
        ent.setOptionKey(o.optionKey());
        ent.setOptionSku(o.optionSku());
        ent.setOptionPrice(o.optionPrice());
        ent.setDisplayYn(o.displayYn());
        ent.setSaleStatus(o.saleStatus());
        if (o.optionId() == null) optionMapper.insert(ent); else optionMapper.update(ent);
      }
    }

    if (req.stocks() != null) {
      for (var s : req.stocks()) {
        Stock ent = s.stockId() == null ? new Stock() : stockMapper.findById(s.stockId()).orElse(new Stock());
        ent.setProductId(productId);
        ent.setOptionId(s.optionId());
        ent.setQuantity(s.quantity());
        ent.setSafetyStock(s.safetyStock());
        if (s.stockId() == null) stockMapper.insert(ent); else stockMapper.update(ent);
      }
    }
  }

  private static String jsonString(String v) {
    if (v == null) return "null";
    return "\"" + v.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }
}


