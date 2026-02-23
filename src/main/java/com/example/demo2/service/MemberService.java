package com.example.demo2.service;

import com.example.demo2.mapper.MemberMapper;
import com.example.demo2.model.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MemberService {
    @Autowired
    private MemberMapper memberMapper;

    public List<Member> getAllMembers() {
        return memberMapper.findAll();
    }

    public Member getMemberById(Integer id) {
        return memberMapper.findById(id);
    }

    public void saveMember(Member member) {
        if (member.getId() == null) {
            memberMapper.insert(member);
        } else {
            memberMapper.update(member);
        }
    }

    public void removeMember(Integer id) {
        memberMapper.delete(id);
    }
}
