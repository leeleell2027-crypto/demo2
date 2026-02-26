package com.example.demo2.controller;

import com.example.demo2.model.Member;
import com.example.demo2.service.MemberService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class LoginController {

    private final MemberService memberService;
    private final PasswordEncoder passwordEncoder;

    public LoginController(MemberService memberService, PasswordEncoder passwordEncoder) {
        this.memberService = memberService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/login2")
    public String login2() {
        return "login";
    }

    @GetMapping("/init-data")
    @ResponseBody
    public String initData() {
        String encodedPassword = passwordEncoder.encode("1234");
        for (int i = 1; i <= 10; i++) {
            Member member = new Member();
            member.setName("Member" + i);
            member.setUsername("user" + i);
            member.setPassword(encodedPassword);
            memberService.saveMember(member);
        }
        return "10 members created with password '1234'";
    }
}
