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

    public Member getMemberById(String id) {
        return memberMapper.findById(id);
    }

    public Member getMemberByUsername(String username) {
        return memberMapper.findByUsername(username);
    }

    public void saveMember(Member member) {
        if (memberMapper.findById(member.getId()) == null) {
            memberMapper.insert(member);
        } else {
            memberMapper.update(member);
        }
    }

    public void updateMember(Member member) {
        memberMapper.update(member);
    }

    public void removeMember(String id) {
        memberMapper.delete(id);
    }

    public int getTotalCount() {
        return memberMapper.count();
    }

    public List<Member> getMembersPaged(int page, int size) {
        int offset = (page - 1) * size;
        return memberMapper.findWithPagination(offset, size);
    }
}
