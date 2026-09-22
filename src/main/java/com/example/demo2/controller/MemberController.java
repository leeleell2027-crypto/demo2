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

        // 鍮꾨?踰덊샇 泥섎━ 濡쒖쭅
        String newPassword = member.getPassword();
        if (newPassword == null || newPassword.trim().isEmpty()) {
            // ?낅젰???놁쑝硫?湲곗〈 鍮꾨?踰덊샇 ?좎?
            member.setPassword(existing.getPassword());
        } else {
            // ??鍮꾨?踰덊샇媛 ?낅젰?섏뿀怨? ?대? ?댁떆???뺥깭媛 ?꾨땲?쇰㈃ ?뷀샇??
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


