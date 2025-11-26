package com.ultrabms.dto.vendors;

import com.ultrabms.entity.enums.PaymentTerms;
import com.ultrabms.entity.enums.WorkOrderCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for creating or updating a vendor
 * Used in POST /api/v1/vendors and PUT /api/v1/vendors/{id}
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorRequestDto {

    // =================================================================
    // COMPANY INFORMATION
    // =================================================================

    /**
     * Company name (required, max 200 chars)
     */
    @NotBlank(message = "Company name is required")
    @Size(max = 200, message = "Company name must be less than 200 characters")
    private String companyName;

    /**
     * Contact person name (required, max 100 chars)
     */
    @NotBlank(message = "Contact person name is required")
    @Size(max = 100, message = "Contact person name must be less than 100 characters")
    private String contactPersonName;

    /**
     * Emirates ID or Trade License Number (required, max 50 chars)
     */
    @NotBlank(message = "Emirates ID or Trade License is required")
    @Size(max = 50, message = "Emirates ID or Trade License must be less than 50 characters")
    private String emiratesIdOrTradeLicense;

    /**
     * UAE Tax Registration Number (optional, 15 digits)
     */
    @Pattern(regexp = "^(\\d{15})?$", message = "TRN must be exactly 15 digits")
    private String trn;

    // =================================================================
    // CONTACT INFORMATION
    // =================================================================

    /**
     * Email address (required, unique, RFC 5322 compliant)
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 254, message = "Email must be less than 254 characters")
    private String email;

    /**
     * Primary phone number (required, E.164 format)
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone number must be in E.164 format (e.g., +971501234567)")
    private String phoneNumber;

    /**
     * Secondary phone number (optional, E.164 format)
     */
    @Pattern(regexp = "^(\\+[1-9]\\d{1,14})?$", message = "Secondary phone must be in E.164 format")
    private String secondaryPhoneNumber;

    /**
     * Company address (optional, max 500 chars)
     */
    @Size(max = 500, message = "Address must be less than 500 characters")
    private String address;

    // =================================================================
    // SERVICE INFORMATION
    // =================================================================

    /**
     * Service categories the vendor provides (required, min 1)
     */
    @NotEmpty(message = "At least one service category is required")
    private List<WorkOrderCategory> serviceCategories;

    /**
     * Property IDs the vendor can service (optional)
     */
    private List<UUID> serviceAreas;

    // =================================================================
    // PAYMENT INFORMATION
    // =================================================================

    /**
     * Hourly rate in AED (required, min 0)
     */
    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Hourly rate must be 0 or greater")
    private BigDecimal hourlyRate;

    /**
     * Emergency callout fee in AED (optional, min 0)
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Emergency callout fee must be 0 or greater")
    private BigDecimal emergencyCalloutFee;

    /**
     * Payment terms (required)
     */
    @NotNull(message = "Payment terms are required")
    private PaymentTerms paymentTerms;
}
