package com.ultrabms.repository;

import com.ultrabms.entity.CompanyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for CompanyProfile entity operations.
 * Single-record design - provides methods to get the singleton company profile.
 *
 * Story 2.8: Company Profile Settings
 */
@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, UUID> {

    /**
     * Get the company profile (single record design).
     * Uses LIMIT 1 since only one record should exist.
     *
     * @return Optional containing the company profile if exists
     */
    @Query("SELECT cp FROM CompanyProfile cp")
    Optional<CompanyProfile> findCompanyProfile();

    /**
     * Check if a company profile exists.
     *
     * @return true if a profile exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(cp) > 0 THEN true ELSE false END FROM CompanyProfile cp")
    boolean existsProfile();

    /**
     * Check if a TRN already exists (for validation during create).
     *
     * @param trn Tax Registration Number to check
     * @return true if TRN exists, false otherwise
     */
    boolean existsByTrn(String trn);

    /**
     * Check if a TRN exists for a different profile (for validation during update).
     *
     * @param trn Tax Registration Number to check
     * @param id Profile ID to exclude from check
     * @return true if TRN exists for another profile, false otherwise
     */
    boolean existsByTrnAndIdNot(String trn, UUID id);
}
