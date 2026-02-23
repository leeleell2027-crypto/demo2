package com.example.demo2.controller;

import com.example.demo2.model.Member;
import com.example.demo2.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class MemberController {
    @Autowired
    private MemberService memberService;

    @GetMapping("/members")
    public List<Member> getMembers() {
        return memberService.getAllMembers();
    }

    @GetMapping("/members/{id}")
    public Member getMember(@PathVariable("id") Integer id) {
        return memberService.getMemberById(id);
    }

    @PostMapping("/members")
    public void addMember(@RequestBody Member member) {
        memberService.saveMember(member);
    }

    @PutMapping("/members")
    public void editMember(@RequestBody Member member) {
        memberService.saveMember(member);
    }

    @DeleteMapping("/members/{id}")
    public void deleteMember(@PathVariable("id") Integer id) {
        memberService.removeMember(id);
    }
}
