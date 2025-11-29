package com.ultrabms.dto.compliance;

import com.ultrabms.entity.Violation;
import com.ultrabms.entity.enums.FineStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for violation list view
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationListDto {

    private UUID id;
    private String violationNumber;
    private String propertyName;
    private String requirementName;
    private LocalDate violationDate;
    private String description;
    private BigDecimal fineAmount;
    private FineStatus fineStatus;

    /**
     * Create DTO from entity
     */
    public static ViolationListDto fromEntity(
            Violation entity,
            String propertyName,
            String requirementName) {
        return ViolationListDto.builder()
                .id(entity.getId())
                .violationNumber(entity.getViolationNumber())
                .propertyName(propertyName)
                .requirementName(requirementName)
                .violationDate(entity.getViolationDate())
                .description(entity.getDescription())
                .fineAmount(entity.getFineAmount())
                .fineStatus(entity.getFineStatus())
                .build();
    }
}
