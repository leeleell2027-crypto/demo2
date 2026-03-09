package com.example.demo2.controller;

import com.example.demo2.model.Menu;
import com.example.demo2.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    @Autowired
    private MenuService menuService;

    @GetMapping
    public List<Menu> getAllMenus() {
        return menuService.getAllMenus();
    }

    @GetMapping("/tree")
    public List<Menu> getMenuTree() {
        return menuService.getMenuTree();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Menu> getMenuById(@PathVariable Integer id) {
        Menu menu = menuService.getMenuById(id);
        return menu != null ? ResponseEntity.ok(menu) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Void> createMenu(@RequestBody Menu menu) {
        menuService.createMenu(menu);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateMenu(@PathVariable Integer id, @RequestBody Menu menu) {
        menu.setId(id);
        menuService.updateMenu(menu);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable Integer id) {
        menuService.deleteMenu(id);
        return ResponseEntity.ok().build();
    }
}
