package org.nexasphere.repository;

import org.nexasphere.model.entity.ActivityEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityEventRepository extends JpaRepository<ActivityEventEntity, Long> {
    List<ActivityEventEntity> findByActivityKey(String activityKey);
}
