package com.example.demo2.model;

public class Enums {
  public enum TaxType { TAX, FREE }
  public enum SaleStatus { ON_SALE, SOLD_OUT, STOP, PENDING }
  public enum OptionSaleStatus { ON_SALE, SOLD_OUT, STOP }
  public enum ChangeTargetType { PRODUCT, OPTION, STOCK }
  public enum ChangeType { PRICE, STOCK, STATUS, DISPLAY, CONTENT, CATEGORY, ETC }
  public enum BulkJobType { STATUS, DISPLAY, PRICE, STOCK }
  public enum BulkJobStatus { UPLOADED, VALIDATED, EXECUTED, FAILED }
  public enum BulkJobItemStatus { PENDING, OK, ERROR }
}




