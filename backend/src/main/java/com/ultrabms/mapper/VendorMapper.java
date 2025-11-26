package com.ultrabms.mapper;

import com.ultrabms.dto.vendors.VendorListDto;
import com.ultrabms.dto.vendors.VendorRequestDto;
import com.ultrabms.dto.vendors.VendorResponseDto;
import com.ultrabms.entity.Vendor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Mapper utility for converting between Vendor entity and DTOs.
 * Manual mapping implementation (can be replaced with MapStruct later).
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Component
public class VendorMapper {

    /**
     * Convert VendorRequestDto to Vendor entity (for create)
     *
     * @param dto VendorRequestDto
     * @return Vendor entity (without id, vendorNumber, status, rating, etc.)
     */
    public Vendor toEntity(VendorRequestDto dto) {
        if (dto == null) {
            return null;
        }

        return Vendor.builder()
                .companyName(dto.getCompanyName())
                .contactPersonName(dto.getContactPersonName())
                .emiratesIdOrTradeLicense(dto.getEmiratesIdOrTradeLicense())
                .trn(dto.getTrn())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .secondaryPhoneNumber(dto.getSecondaryPhoneNumber())
                .address(dto.getAddress())
                .serviceCategories(dto.getServiceCategories() != null ? new ArrayList<>(dto.getServiceCategories()) : new ArrayList<>())
                .serviceAreas(dto.getServiceAreas() != null ? new ArrayList<>(dto.getServiceAreas()) : new ArrayList<>())
                .hourlyRate(dto.getHourlyRate())
                .emergencyCalloutFee(dto.getEmergencyCalloutFee())
                .paymentTerms(dto.getPaymentTerms())
                .build();
    }

    /**
     * Update existing Vendor entity with VendorRequestDto values (for update)
     *
     * @param dto    VendorRequestDto with new values
     * @param entity Existing Vendor entity to update
     */
    public void updateEntity(VendorRequestDto dto, Vendor entity) {
        if (dto == null || entity == null) {
            return;
        }

        entity.setCompanyName(dto.getCompanyName());
        entity.setContactPersonName(dto.getContactPersonName());
        entity.setEmiratesIdOrTradeLicense(dto.getEmiratesIdOrTradeLicense());
        entity.setTrn(dto.getTrn());
        entity.setEmail(dto.getEmail());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setSecondaryPhoneNumber(dto.getSecondaryPhoneNumber());
        entity.setAddress(dto.getAddress());
        entity.setServiceCategories(dto.getServiceCategories() != null ? new ArrayList<>(dto.getServiceCategories()) : new ArrayList<>());
        entity.setServiceAreas(dto.getServiceAreas() != null ? new ArrayList<>(dto.getServiceAreas()) : new ArrayList<>());
        entity.setHourlyRate(dto.getHourlyRate());
        entity.setEmergencyCalloutFee(dto.getEmergencyCalloutFee());
        entity.setPaymentTerms(dto.getPaymentTerms());
    }

    /**
     * Convert Vendor entity to VendorResponseDto (full detail)
     *
     * @param entity Vendor entity
     * @return VendorResponseDto
     */
    public VendorResponseDto toResponseDto(Vendor entity) {
        if (entity == null) {
            return null;
        }

        return VendorResponseDto.builder()
                .id(entity.getId())
                .vendorNumber(entity.getVendorNumber())
                .companyName(entity.getCompanyName())
                .contactPersonName(entity.getContactPersonName())
                .emiratesIdOrTradeLicense(entity.getEmiratesIdOrTradeLicense())
                .trn(entity.getTrn())
                .email(entity.getEmail())
                .phoneNumber(entity.getPhoneNumber())
                .secondaryPhoneNumber(entity.getSecondaryPhoneNumber())
                .address(entity.getAddress())
                .serviceCategories(entity.getServiceCategories())
                .serviceAreas(entity.getServiceAreas())
                .hourlyRate(entity.getHourlyRate())
                .emergencyCalloutFee(entity.getEmergencyCalloutFee())
                .paymentTerms(entity.getPaymentTerms())
                .status(entity.getStatus())
                .rating(entity.getRating())
                .totalJobsCompleted(entity.getTotalJobsCompleted())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .version(entity.getVersion())
                .build();
    }

    /**
     * Convert Vendor entity to VendorResponseDto with additional metrics
     *
     * @param entity               Vendor entity
     * @param workOrderCount       Total work orders for this vendor
     * @param averageCompletionTime Average completion time in days
     * @return VendorResponseDto with metrics
     */
    public VendorResponseDto toResponseDtoWithMetrics(Vendor entity, Integer workOrderCount, Double averageCompletionTime) {
        VendorResponseDto dto = toResponseDto(entity);
        if (dto != null) {
            dto.setWorkOrderCount(workOrderCount);
            dto.setAverageCompletionTime(averageCompletionTime);
        }
        return dto;
    }

    /**
     * Convert Vendor entity to VendorListDto (summary for list view)
     *
     * @param entity Vendor entity
     * @return VendorListDto
     */
    public VendorListDto toListDto(Vendor entity) {
        if (entity == null) {
            return null;
        }

        return VendorListDto.builder()
                .id(entity.getId())
                .vendorNumber(entity.getVendorNumber())
                .companyName(entity.getCompanyName())
                .contactPersonName(entity.getContactPersonName())
                .serviceCategories(entity.getServiceCategories())
                .rating(entity.getRating())
                .status(entity.getStatus())
                .build();
    }

    /**
     * Convert list of Vendor entities to list of VendorListDto
     *
     * @param entities List of Vendor entities
     * @return List of VendorListDto
     */
    public List<VendorListDto> toListDtoList(List<Vendor> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toListDto)
                .toList();
    }
}
