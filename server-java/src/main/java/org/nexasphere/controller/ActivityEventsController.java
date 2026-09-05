package org.nexasphere.controller;

import jakarta.validation.Valid;
import org.nexasphere.model.entity.ActivityEventEntity;
import org.nexasphere.repository.ActivityEventRepository;
import org.nexasphere.util.Sanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/activity-events")
public class ActivityEventsController {

    private final ActivityEventRepository repo;

    public ActivityEventsController(ActivityEventRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/{activityKey}")
    public List<ActivityEventEntity> getByActivity(@PathVariable String activityKey) {
        return repo.findByActivityKey(activityKey);
    }

    @PostMapping("/{activityKey}")
    public ResponseEntity<ActivityEventEntity> create(
            @PathVariable String activityKey,
            @Valid @RequestBody ActivityEventEntity event) {
        event.setId(null);
        event.setActivityKey(activityKey);
        event.setName(Sanitizer.clean(event.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(event));
    }

    @DeleteMapping("/{activityKey}/{id}")
    public ResponseEntity<Void> delete(@PathVariable String activityKey, @PathVariable Long id) {
        var found = repo.findById(id).filter(e -> e.getActivityKey().equals(activityKey));
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        repo.delete(found.get());
        return ResponseEntity.noContent().build();
    }
}
