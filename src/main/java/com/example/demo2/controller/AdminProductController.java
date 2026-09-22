package com.example.demo2.controller;

import com.example.demo2.admin.ActorResolver;
import com.example.demo2.model.Enums;
import com.example.demo2.service.ProductService;
import com.example.demo2.model.ProductDtos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import com.example.demo2.model.ProductPageResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/products")
public class AdminProductController {

  private final ProductService productService;
  private final ActorResolver actorResolver;

  public AdminProductController(ProductService productService, ActorResolver actorResolver) {
    this.productService = productService;
    this.actorResolver = actorResolver;
  }

  @GetMapping
  public ProductPageResponse list(
      @RequestParam(required = false) String q,
      @RequestParam(required = false, defaultValue = "NAME") String qType,
      @RequestParam(required = false) List<Enums.SaleStatus> saleStatus,
      @RequestParam(required = false) Boolean displayYn,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size
  ) {
    return productService.list(q, qType, saleStatus, displayYn, from, to, page, size);
  }

  @GetMapping("/{id}")
  public ProductDtos.ProductDetail detail(@PathVariable("id") Long id) {
    return productService.detail(id);
  }

  @PostMapping
  public Long create(HttpServletRequest req, @Valid @RequestBody ProductDtos.ProductUpsertRequest body) {
    var actor = actorResolver.resolve(req);
    return productService.create(actor, body);
  }

  @PutMapping("/{id}")
  public void update(HttpServletRequest req, @PathVariable("id") Long id,
                     @Valid @RequestBody ProductDtos.ProductUpsertRequest body) {
    var actor = actorResolver.resolve(req);
    productService.update(actor, id, body);
  }

  @PatchMapping("/{id}/display")
  public void patchDisplay(HttpServletRequest req, @PathVariable("id") Long id,
                           @Valid @RequestBody ProductDtos.PatchDisplayRequest body) {
    var actor = actorResolver.resolve(req);
    productService.patchDisplay(actor, id, body.displayYn(), body.reason());
  }

  @PatchMapping("/{id}/status")
  public void patchStatus(HttpServletRequest req, @PathVariable("id") Long id,
                          @Valid @RequestBody ProductDtos.PatchStatusRequest body) {
    var actor = actorResolver.resolve(req);
    productService.patchStatus(actor, id, body.saleStatus(), body.reason());
  }
}


