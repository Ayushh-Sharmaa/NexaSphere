package org.nexasphere.repository;

import org.nexasphere.model.entity.CoreTeamMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoreTeamRepository extends JpaRepository<CoreTeamMemberEntity, Long> {}
