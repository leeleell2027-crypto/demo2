package com.example.demo2.security;

import com.example.demo2.model.Member;
import com.example.demo2.service.MemberService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberService memberService;

    public CustomOAuth2UserService(MemberService memberService) {
        this.memberService = memberService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 인스타그램 정보 추출
        String username = oAuth2User.getAttribute("username");
        String id = oAuth2User.getAttribute("id");

        // DB 확인 및 자동 가입
        Member member = memberService.getMemberByUsername(username);
        if (member == null) {
            member = new Member();
            member.setUsername(username);
            member.setName("Instagram User (" + username + ")");
            member.setPassword(""); // 소셜 로그인이므로 비밀번호 무의미
            memberService.saveMember(member);
        }

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        return new DefaultOAuth2User(
                Collections.emptyList(),
                attributes,
                "username");
    }
}
