package com.example.demo2.service;

import com.example.demo2.mapper.MenuMapper;
import com.example.demo2.model.Menu;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MenuService {

    @Autowired
    private MenuMapper menuMapper;

    public List<Menu> getAllMenus() {
        return menuMapper.findAll();
    }

    public List<Menu> getMenuTree() {
        List<Menu> allMenus = menuMapper.findAllActive();
        return buildTree(allMenus);
    }

    private List<Menu> buildTree(List<Menu> menus) {
        Map<Integer, List<Menu>> childrenByParentId = menus.stream()
                .filter(m -> m.getParentId() != null)
                .collect(Collectors.groupingBy(Menu::getParentId));

        List<Menu> rootMenus = menus.stream()
                .filter(m -> m.getParentId() == null)
                .collect(Collectors.toList());

        for (Menu root : rootMenus) {
            root.setChildren(childrenByParentId.getOrDefault(root.getId(), new ArrayList<>()));
        }

        return rootMenus;
    }

    public Menu getMenuById(Integer id) {
        return menuMapper.findById(id);
    }

    @Transactional
    public void createMenu(Menu menu) {
        menuMapper.insert(menu);
    }

    @Transactional
    public void updateMenu(Menu menu) {
        menuMapper.update(menu);
    }

    @Transactional
    public void deleteMenu(Integer id) {
        menuMapper.delete(id);
    }
}
