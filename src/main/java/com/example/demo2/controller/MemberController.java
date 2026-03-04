package com.example.demo2.controller;

import com.example.demo2.model.Member;
import com.example.demo2.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {
    @Autowired
    private MemberService memberService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Member> getMembers() {
        return memberService.getAllMembers();
    }

    @GetMapping("/test")
    public String test() {
        return "Member API is working";
    }

    @GetMapping("/paged")
    public java.util.Map<String, Object> getMembersPaged(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("members", memberService.getMembersPaged(page, size));
        result.put("total", memberService.getTotalCount());
        return result;
    }

    @GetMapping("/count")
    public int getMemberCount() {
        return memberService.getTotalCount();
    }

    @PostMapping
    public void addMember(@RequestBody Member member) {
        if (member.getPassword() != null && !member.getPassword().isEmpty()) {
            member.setPassword(passwordEncoder.encode(member.getPassword()));
        }
        memberService.saveMember(member);
    }

    @PutMapping
    public void editMember(@RequestBody Member member) {
        Member existing = memberService.getMemberById(member.getId());
        if (existing == null) {
            throw new RuntimeException("Member not found: " + member.getId());
        }

        // 비밀번호 처리 로직
        String newPassword = member.getPassword();
        if (newPassword == null || newPassword.trim().isEmpty()) {
            // 입력이 없으면 기존 비밀번호 유지
            member.setPassword(existing.getPassword());
        } else {
            // 새 비밀번호가 입력되었고, 이미 해시된 형태가 아니라면 암호화
            if (!newPassword.startsWith("$2a$")) {
                member.setPassword(passwordEncoder.encode(newPassword));
            }
        }

        memberService.saveMember(member);
    }

    @DeleteMapping("/{id}")
    public void deleteMember(@PathVariable("id") String id) {
        memberService.removeMember(id);
    }
}
