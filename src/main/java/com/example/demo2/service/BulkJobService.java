package com.example.demo2.service;

import com.example.demo2.admin.Actor;
import com.example.demo2.model.BulkJob;
import com.example.demo2.model.BulkJobItem;
import com.example.demo2.model.Product;
import com.example.demo2.model.Stock;
import com.example.demo2.mapper.*;
import com.example.demo2.model.BulkDtos;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;

import static com.example.demo2.model.Enums.*;

@Service
@RequiredArgsConstructor
public class BulkJobService {

  private final BulkJobMapper bulkJobMapper;
  private final BulkJobItemMapper bulkJobItemMapper;
  private final ProductMapper productMapper;
  private final ProductOptionMapper optionMapper;
  private final StockMapper stockMapper;
  private final ChangeLogService changeLogService;

  /**
   * XLSX ???ロ깵??1?????녹맠):
   * productId | optionSku | value
   * - STATUS: value=ON_SALE/SOLD_OUT/STOP/PENDING
   * - DISPLAY: value=true/false
   * - PRICE: value=???瑗삥뤆?쎛(int) (?????????optionSku??????嶺뚯솘???
   * - STOCK: value=????int) (?????????optionSku??????嶺뚯솘???
   */
  @Transactional
  public long uploadXlsx(Actor actor, BulkJobType jobType, InputStream is) {
    BulkJob job = BulkJob.builder()
        .jobType(jobType)
        .status(BulkJobStatus.UPLOADED)
        .totalCount(0)
        .errorCount(0)
        .actorId(actor.actorId())
        .actorRole(actor.role())
        .build();
    bulkJobMapper.insert(job);

    List<BulkJobItem> items = new ArrayList<>();

    try (Workbook wb = new XSSFWorkbook(is)) {
      Sheet sheet = wb.getSheetAt(0);
      int lastRow = sheet.getLastRowNum();
      for (int r = 1; r <= lastRow; r++) {
        Row row = sheet.getRow(r);
        if (row == null) continue;

        Long productId = getLong(row.getCell(0));
        String optionSku = getString(row.getCell(1));
        String value = getString(row.getCell(2));

        if (productId == null && (optionSku == null || optionSku.isBlank())) continue; // empty row

        String payloadJson = "{\"value\":" + jsonString(value) + "}";

        items.add(BulkJobItem.builder()
            .jobId(job.getJobId())
            .rowNo(r)
            .productId(productId)
            .optionSku(optionSku)
            .payloadJson(payloadJson)
            .status(BulkJobItemStatus.PENDING)
            .build());
      }
    } catch (Exception e) {
      job.setStatus(BulkJobStatus.FAILED);
      bulkJobMapper.update(job);
      throw new IllegalArgumentException("invalid xlsx: " + e.getMessage(), e);
    }

    items.forEach(bulkJobItemMapper::insert);
    job.setTotalCount(items.size());
    bulkJobMapper.update(job);

    // Validation step (light)
    validate(job.getJobId());
    return job.getJobId();
  }

  @Transactional
  public void validate(long jobId) {
    BulkJob job = bulkJobMapper.findById(jobId)
        .orElseThrow(() -> new IllegalArgumentException("bulk job not found: " + jobId));

    List<BulkJobItem> items = bulkJobItemMapper.findByJobIdOrderByRowNoAsc(jobId);
    int errors = 0;

    for (BulkJobItem item : items) {
      String err = validateItem(job.getJobType(), item);
      if (err != null) {
        item.setStatus(BulkJobItemStatus.ERROR);
        item.setErrorMessage(err);
        errors++;
      } else {
        item.setStatus(BulkJobItemStatus.OK);
        item.setErrorMessage(null);
      }
    }
    items.forEach(bulkJobItemMapper::insert);

    job.setErrorCount(errors);
    job.setStatus(BulkJobStatus.VALIDATED);
    bulkJobMapper.update(job);
  }

  private String validateItem(BulkJobType type, BulkJobItem item) {
    String value = extractValue(item.getPayloadJson());

    if (type == BulkJobType.STATUS) {
      try { SaleStatus.valueOf(value); } catch (Exception e) { return "invalid status: " + value; }
    }
    if (type == BulkJobType.DISPLAY) {
      if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) return "invalid displayYn: " + value;
    }
    if (type == BulkJobType.PRICE || type == BulkJobType.STOCK) {
      try { Integer.parseInt(value); } catch (Exception e) { return "invalid number: " + value; }
    }

    if (item.getProductId() == null && (item.getOptionSku() == null || item.getOptionSku().isBlank())) {
      return "productId or optionSku required";
    }

    // basic existence checks
    if (item.getProductId() != null && productMapper.findById(item.getProductId()).isEmpty()) {
      return "product not found: " + item.getProductId();
    }
    if (item.getOptionSku() != null && !item.getOptionSku().isBlank() && optionMapper.findByOptionSku(item.getOptionSku()).isEmpty()) {
      return "option not found: " + item.getOptionSku();
    }

    return null;
  }

  @Transactional
  public void execute(Actor actor, long jobId) {
    BulkJob job = bulkJobMapper.findById(jobId)
        .orElseThrow(() -> new IllegalArgumentException("bulk job not found: " + jobId));

    if (job.getStatus() != BulkJobStatus.VALIDATED) {
      throw new IllegalStateException("job must be VALIDATED before execute");
    }

    List<BulkJobItem> items = bulkJobItemMapper.findByJobIdOrderByRowNoAsc(jobId);

    for (BulkJobItem item : items) {
      if (item.getStatus() == BulkJobItemStatus.ERROR) continue;
      apply(job.getJobType(), actor, item);
    }

    job.setStatus(BulkJobStatus.EXECUTED);
    bulkJobMapper.update(job);
  }

  private void apply(BulkJobType type, Actor actor, BulkJobItem item) {
    String value = extractValue(item.getPayloadJson());

    if (type == BulkJobType.STATUS) {
      SaleStatus st = SaleStatus.valueOf(value);
      Long productId = resolveProductId(item);
      Product p = productMapper.findById(productId).orElseThrow();
      String before = "{\"saleStatus\":\"" + p.getSaleStatus() + "\"}";
      p.setSaleStatus(st);
      productMapper.update(p);
      String after = "{\"saleStatus\":\"" + p.getSaleStatus() + "\"}";
      changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null, ChangeType.STATUS, before, after, "bulk");
      return;
    }

    if (type == BulkJobType.DISPLAY) {
      boolean yn = Boolean.parseBoolean(value);
      Long productId = resolveProductId(item);
      Product p = productMapper.findById(productId).orElseThrow();
      String before = "{\"displayYn\":" + p.getDisplayYn() + "}";
      p.setDisplayYn(yn);
      productMapper.update(p);
      String after = "{\"displayYn\":" + p.getDisplayYn() + "}";
      changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null, ChangeType.DISPLAY, before, after, "bulk");
      return;
    }

    if (type == BulkJobType.PRICE) {
      int price = Integer.parseInt(value);
      if (item.getOptionSku() != null && !item.getOptionSku().isBlank()) {
        var opt = optionMapper.findByOptionSku(item.getOptionSku()).orElseThrow();
        String before = "{\"optionPrice\":" + opt.getOptionPrice() + "}";
        opt.setOptionPrice(price);
        optionMapper.update(opt);
        String after = "{\"optionPrice\":" + opt.getOptionPrice() + "}";
        changeLogService.log(actor, ChangeTargetType.OPTION, opt.getProductId(), opt.getOptionId(), ChangeType.PRICE, before, after, "bulk");
      } else {
        Long productId = resolveProductId(item);
        Product p = productMapper.findById(productId).orElseThrow();
        String before = "{\"salePrice\":" + p.getSalePrice() + "}";
        p.setSalePrice(price);
        productMapper.update(p);
        String after = "{\"salePrice\":" + p.getSalePrice() + "}";
        changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null, ChangeType.PRICE, before, after, "bulk");
      }
      return;
    }

    if (type == BulkJobType.STOCK) {
      int qty = Integer.parseInt(value);
      if (qty < 0) qty = 0;

      if (item.getOptionSku() != null && !item.getOptionSku().isBlank()) {
        var opt = optionMapper.findByOptionSku(item.getOptionSku()).orElseThrow();
        Stock st = stockMapper.findByOptionId(opt.getOptionId()).orElseGet(() -> Stock.builder()
            .productId(opt.getProductId())
            .optionId(opt.getOptionId())
            .quantity(0)
            .build());
        String before = "{\"quantity\":" + st.getQuantity() + "}";
        st.setQuantity(qty);
        if (st.getStockId() == null) stockMapper.insert(st); else stockMapper.update(st);
        String after = "{\"quantity\":" + st.getQuantity() + "}";
        changeLogService.log(actor, ChangeTargetType.STOCK, opt.getProductId(), opt.getOptionId(), ChangeType.STOCK, before, after, "bulk");
      } else {
        Long productId = resolveProductId(item);
        Product p = productMapper.findById(productId).orElseThrow();
        String before = "{\"totalStock\":" + p.getTotalStock() + "}";
        p.setTotalStock(qty);
        productMapper.update(p);
        String after = "{\"totalStock\":" + p.getTotalStock() + "}";
        changeLogService.log(actor, ChangeTargetType.PRODUCT, productId, null, ChangeType.STOCK, before, after, "bulk");
      }
    }
  }

  public BulkDtos.BulkJobResponse get(long jobId) {
    BulkJob job = bulkJobMapper.findById(jobId)
        .orElseThrow(() -> new IllegalArgumentException("bulk job not found: " + jobId));
    List<BulkJobItem> items = bulkJobItemMapper.findByJobIdOrderByRowNoAsc(jobId);

    return new BulkDtos.BulkJobResponse(
        job.getJobId(), job.getJobType(), job.getStatus(), job.getTotalCount(), job.getErrorCount(), job.getCreatedAt(),
        items.stream().map(i -> new BulkDtos.BulkJobItemResponse(
            i.getRowNo(), i.getProductId(), i.getOptionSku(), i.getStatus(), i.getErrorMessage(), i.getPayloadJson()
        )).toList()
    );
  }

  private Long resolveProductId(BulkJobItem item) {
    if (item.getProductId() != null) return item.getProductId();
    if (item.getOptionSku() != null) {
      return optionMapper.findByOptionSku(item.getOptionSku()).orElseThrow().getProductId();
    }
    throw new IllegalArgumentException("productId not resolvable");
  }

  private static Long getLong(Cell cell) {
    if (cell == null) return null;
    if (cell.getCellType() == CellType.NUMERIC) return (long) cell.getNumericCellValue();
    String s = getString(cell);
    if (s == null || s.isBlank()) return null;
    try { return Long.parseLong(s.trim()); } catch (Exception e) { return null; }
  }

  private static String getString(Cell cell) {
    if (cell == null) return null;
    return switch (cell.getCellType()) {
      case STRING -> cell.getStringCellValue();
      case NUMERIC -> {
        double v = cell.getNumericCellValue();
        long lv = (long) v;
        if (Math.abs(v - lv) < 0.0000001) yield String.valueOf(lv);
        yield String.valueOf(v);
      }
      case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
      case FORMULA -> cell.getCellFormula();
      case BLANK, _NONE, ERROR -> null;
    };
  }

  private static String extractValue(String payloadJson) {
    // payloadJson: {"value":"..."} or {"value":123}
    int idx = payloadJson.indexOf("\"value\"");
    if (idx < 0) return "";
    int colon = payloadJson.indexOf(":", idx);
    String raw = payloadJson.substring(colon + 1).trim();
    if (raw.endsWith("}")) raw = raw.substring(0, raw.length() - 1).trim();
    if (raw.startsWith("\"") && raw.endsWith("\"")) {
      raw = raw.substring(1, raw.length() - 1);
    }
    return raw;
  }

  private static String jsonString(String v) {
    if (v == null) return "null";
    return "\"" + v.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }
}



