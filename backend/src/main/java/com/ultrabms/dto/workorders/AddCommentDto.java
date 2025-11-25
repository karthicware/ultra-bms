package com.ultrabms.dto.workorders;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for adding a comment to a work order
 * Used in POST /api/v1/work-orders/{id}/comments
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddCommentDto {

    /**
     * Comment text (1-2000 characters)
     */
    @NotBlank(message = "Comment text is required")
    @Size(min = 1, max = 2000, message = "Comment must be between 1 and 2000 characters")
    private String commentText;

    // Note: createdBy is auto-filled from authenticated user context
    // isStatusChange is set by service layer for status change comments
}
