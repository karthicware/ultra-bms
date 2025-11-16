package com.ultrabms.dto.units;

import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.UnitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for Unit response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitResponse {

    private UUID id;
    private UUID propertyId;
    private String unitNumber;
    private Integer floor;
    private Integer bedroomCount;
    private Integer bathroomCount;
    private BigDecimal squareFootage;
    private BigDecimal monthlyRent;
    private UnitStatus status;
    private Map<String, Object> features;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;

    /**
     * Convert Unit entity to UnitResponse DTO
     */
    public static UnitResponse fromEntity(Unit unit) {
        return UnitResponse.builder()
                .id(unit.getId())
                .propertyId(unit.getProperty().getId())
                .unitNumber(unit.getUnitNumber())
                .floor(unit.getFloor())
                .bedroomCount(unit.getBedroomCount())
                .bathroomCount(unit.getBathroomCount())
                .squareFootage(unit.getSquareFootage())
                .monthlyRent(unit.getMonthlyRent())
                .status(unit.getStatus())
                .features(unit.getFeatures())
                .active(unit.getActive())
                .createdAt(unit.getCreatedAt())
                .updatedAt(unit.getUpdatedAt())
                .createdBy(unit.getCreatedBy())
                .build();
    }
}
