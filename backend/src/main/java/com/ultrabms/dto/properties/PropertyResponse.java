package com.ultrabms.dto.properties;

import com.ultrabms.entity.Property;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Property response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {

    private UUID id;
    private String name;
    private String address;
    private PropertyType propertyType;
    private Integer totalUnitsCount;
    private UUID managerId;
    private ManagerInfo manager;
    private Integer yearBuilt;
    private BigDecimal totalSquareFootage;
    private List<String> amenities;
    private PropertyStatus status;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;

    // Additional computed fields
    private Integer occupiedUnits;
    private Integer availableUnits;
    private Integer underMaintenanceUnits;
    private Integer reservedUnits;
    private Double occupancyRate;

    // Images
    private List<PropertyImageInfo> images;
    private String thumbnailUrl;

    /**
     * Nested DTO for property image information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyImageInfo {
        private UUID id;
        private String fileName;
        private String filePath;
        private Long fileSize;
        private Integer displayOrder;
    }

    /**
     * Nested DTO for manager information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerInfo {
        private UUID id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String avatar;

        public static ManagerInfo fromUser(User user) {
            if (user == null) return null;
            return ManagerInfo.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .avatar(user.getAvatarFilePath())
                    .build();
        }
    }

    /**
     * Convert Property entity to PropertyResponse DTO
     */
    public static PropertyResponse fromEntity(Property property) {
        User managerUser = property.getManager();
        return PropertyResponse.builder()
                .id(property.getId())
                .name(property.getName())
                .address(property.getAddress())
                .propertyType(property.getPropertyType())
                .totalUnitsCount(property.getTotalUnitsCount())
                .managerId(managerUser != null ? managerUser.getId() : null)
                .manager(ManagerInfo.fromUser(managerUser))
                .yearBuilt(property.getYearBuilt())
                .totalSquareFootage(property.getTotalSquareFootage())
                .amenities(property.getAmenities())
                .status(property.getStatus())
                .active(property.getActive())
                .createdAt(property.getCreatedAt())
                .updatedAt(property.getUpdatedAt())
                .createdBy(property.getCreatedBy())
                .build();
    }

    /**
     * Convert Property entity to PropertyResponse DTO with occupancy data
     */
    public static PropertyResponse fromEntityWithOccupancy(
            Property property,
            int occupiedUnits,
            int availableUnits,
            int underMaintenanceUnits,
            int reservedUnits
    ) {
        PropertyResponse response = fromEntity(property);
        response.setOccupiedUnits(occupiedUnits);
        response.setAvailableUnits(availableUnits);
        response.setUnderMaintenanceUnits(underMaintenanceUnits);
        response.setReservedUnits(reservedUnits);

        // Calculate occupancy rate
        int totalUnits = property.getTotalUnitsCount();
        if (totalUnits > 0) {
            response.setOccupancyRate((double) occupiedUnits / totalUnits * 100);
        } else {
            response.setOccupancyRate(0.0);
        }

        return response;
    }
}
