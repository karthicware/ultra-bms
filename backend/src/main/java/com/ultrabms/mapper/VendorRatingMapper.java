package com.ultrabms.mapper;

import com.ultrabms.dto.vendor.VendorRatingDto;
import com.ultrabms.dto.vendor.VendorRatingRequestDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.VendorRating;
import com.ultrabms.entity.WorkOrder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper utility for converting between VendorRating entity and DTOs.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Component
public class VendorRatingMapper {

    /**
     * Convert VendorRatingRequestDto to VendorRating entity
     *
     * @param dto       VendorRatingRequestDto
     * @param workOrder Associated work order
     * @param vendor    Associated vendor
     * @param ratedBy   User who submitted the rating
     * @return VendorRating entity
     */
    public VendorRating toEntity(
            VendorRatingRequestDto dto,
            WorkOrder workOrder,
            Vendor vendor,
            User ratedBy
    ) {
        if (dto == null) {
            return null;
        }

        VendorRating rating = VendorRating.builder()
                .workOrder(workOrder)
                .vendor(vendor)
                .ratedBy(ratedBy)
                .qualityScore(dto.getQualityScore())
                .timelinessScore(dto.getTimelinessScore())
                .communicationScore(dto.getCommunicationScore())
                .professionalismScore(dto.getProfessionalismScore())
                .comments(dto.getComments())
                .ratedAt(LocalDateTime.now())
                .build();

        // Calculate overall score
        rating.calculateOverallScore();

        return rating;
    }

    /**
     * Update existing VendorRating entity with new values
     *
     * @param dto    VendorRatingRequestDto with new values
     * @param entity Existing VendorRating entity to update
     */
    public void updateEntity(VendorRatingRequestDto dto, VendorRating entity) {
        if (dto == null || entity == null) {
            return;
        }

        entity.setQualityScore(dto.getQualityScore());
        entity.setTimelinessScore(dto.getTimelinessScore());
        entity.setCommunicationScore(dto.getCommunicationScore());
        entity.setProfessionalismScore(dto.getProfessionalismScore());
        entity.setComments(dto.getComments());

        // Recalculate overall score
        entity.calculateOverallScore();
    }

    /**
     * Convert VendorRating entity to VendorRatingDto
     *
     * @param entity VendorRating entity
     * @return VendorRatingDto
     */
    public VendorRatingDto toDto(VendorRating entity) {
        if (entity == null) {
            return null;
        }

        return VendorRatingDto.builder()
                .id(entity.getId())
                .workOrderId(entity.getWorkOrder() != null ? entity.getWorkOrder().getId() : null)
                .workOrderNumber(entity.getWorkOrder() != null ? entity.getWorkOrder().getWorkOrderNumber() : null)
                .vendorId(entity.getVendor() != null ? entity.getVendor().getId() : null)
                .qualityScore(entity.getQualityScore())
                .timelinessScore(entity.getTimelinessScore())
                .communicationScore(entity.getCommunicationScore())
                .professionalismScore(entity.getProfessionalismScore())
                .overallScore(entity.getOverallScore())
                .comments(entity.getComments())
                .ratedBy(entity.getRatedBy() != null ? entity.getRatedBy().getId() : null)
                .ratedByName(entity.getRatedBy() != null ? entity.getRatedBy().getFullName() : null)
                .ratedAt(entity.getRatedAt())
                .canUpdate(entity.isUpdateAllowed())
                .build();
    }

    /**
     * Convert list of VendorRating entities to list of VendorRatingDto
     *
     * @param entities List of VendorRating entities
     * @return List of VendorRatingDto
     */
    public List<VendorRatingDto> toDtoList(List<VendorRating> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Calculate overall score from individual scores
     *
     * @param quality         Quality score (1-5)
     * @param timeliness      Timeliness score (1-5)
     * @param communication   Communication score (1-5)
     * @param professionalism Professionalism score (1-5)
     * @return Overall score with 2 decimal precision
     */
    public BigDecimal calculateOverallScore(
            int quality,
            int timeliness,
            int communication,
            int professionalism
    ) {
        double sum = quality + timeliness + communication + professionalism;
        double average = sum / 4.0;
        return BigDecimal.valueOf(Math.round(average * 100.0) / 100.0);
    }
}
