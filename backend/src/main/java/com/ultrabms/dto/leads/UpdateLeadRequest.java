package com.ultrabms.dto.leads;

import com.ultrabms.entity.Lead;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing lead
 * SCP-2025-12-06: Identity documents (Emirates ID, passport) are now collected during quotation workflow
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLeadRequest {

    @Size(min = 2, max = 200, message = "Full name must be between 2 and 200 characters")
    private String fullName;

    @Email(message = "Email must be valid")
    @Size(max = 255)
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Contact number must be valid E.164 format")
    private String contactNumber;

    private Lead.LeadSource leadSource;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @Size(max = 255, message = "Property interest must not exceed 255 characters")
    private String propertyInterest;
}
