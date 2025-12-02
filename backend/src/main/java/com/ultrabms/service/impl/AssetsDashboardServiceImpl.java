package com.ultrabms.service.impl;

import com.ultrabms.dto.dashboard.assets.AssetKpiDto;
import com.ultrabms.dto.dashboard.assets.AssetsByCategoryDto;
import com.ultrabms.dto.dashboard.assets.AssetsDashboardDto;
import com.ultrabms.dto.dashboard.assets.DepreciationSummaryDto;
import com.ultrabms.dto.dashboard.assets.OverduePmAssetDto;
import com.ultrabms.dto.dashboard.assets.RecentAssetDto;
import com.ultrabms.dto.dashboard.assets.TopMaintenanceSpendDto;
import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.repository.AssetsDashboardRepository;
import com.ultrabms.service.AssetsDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of AssetsDashboardService.
 * Provides assets dashboard data with 5-minute Ehcache caching (AC-18).
 *
 * Story 8.7: Assets Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AssetsDashboardServiceImpl implements AssetsDashboardService {

    private final AssetsDashboardRepository assetsDashboardRepository;

    private static final int DEFAULT_TOP_MAINTENANCE_LIMIT = 5;
    private static final int DEFAULT_OVERDUE_PM_LIMIT = 20;
    private static final int DEFAULT_RECENT_ASSETS_LIMIT = 5;
    private static final int CRITICAL_OVERDUE_DAYS = 30;

    @Override
    @Cacheable(value = "assetsDashboard", key = "'all'")
    public AssetsDashboardDto getAssetsDashboard() {
        log.debug("Fetching complete assets dashboard data");

        return AssetsDashboardDto.builder()
                .kpis(getKpis())
                .assetsByCategory(getAssetsByCategory())
                .topMaintenanceSpend(getTopMaintenanceSpend())
                .overduePmAssets(getOverduePmAssets())
                .recentlyAddedAssets(getRecentlyAddedAssets())
                .depreciationSummary(getDepreciationSummary())
                .build();
    }

    @Override
    @Cacheable(value = "assetsKpis", key = "'kpis'")
    public AssetKpiDto getKpis() {
        log.debug("Fetching assets KPIs");

        // AC-1: Total Registered Assets
        Long totalAssets = assetsDashboardRepository.countTotalRegisteredAssets();

        // AC-2: Total Asset Value
        Double totalValue = assetsDashboardRepository.sumTotalAssetValue();
        BigDecimal totalAssetValue = totalValue != null
                ? BigDecimal.valueOf(totalValue).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // AC-3: Assets with Overdue PM
        Long overduePmCount = assetsDashboardRepository.countAssetsWithOverduePm();

        // AC-4: Most Expensive Asset by TCO
        AssetKpiDto.MostExpensiveAssetKpi mostExpensiveAsset = null;
        Object[] tcoData = assetsDashboardRepository.getMostExpensiveAssetByTco();
        if (tcoData != null) {
            mostExpensiveAsset = AssetKpiDto.MostExpensiveAssetKpi.builder()
                    .assetId(toUuid(tcoData[0]))
                    .assetName((String) tcoData[1])
                    .assetNumber((String) tcoData[2])
                    .tco(toBigDecimal(tcoData[3]))
                    .build();
        }

        return AssetKpiDto.builder()
                .totalRegisteredAssets(totalAssets != null ? totalAssets : 0L)
                .totalAssetValue(totalAssetValue)
                .assetsWithOverduePm(overduePmCount != null ? overduePmCount : 0L)
                .mostExpensiveAsset(mostExpensiveAsset)
                .build();
    }

    @Override
    @Cacheable(value = "assetsByCategory", key = "'categories'")
    public List<AssetsByCategoryDto> getAssetsByCategory() {
        log.debug("Fetching assets by category");

        List<Object[]> data = assetsDashboardRepository.getAssetsByCategory();
        List<AssetsByCategoryDto> result = new ArrayList<>();

        for (Object[] row : data) {
            AssetCategory category = parseAssetCategory((String) row[0]);
            result.add(AssetsByCategoryDto.builder()
                    .category(category)
                    .categoryDisplayName((String) row[1])
                    .count(toLong(row[2]))
                    .percentage(toBigDecimal(row[3]))
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "topMaintenanceSpend", key = "'top5'")
    public List<TopMaintenanceSpendDto> getTopMaintenanceSpend() {
        log.debug("Fetching top 5 assets by maintenance spend");

        List<Object[]> data = assetsDashboardRepository.getTopMaintenanceSpend(DEFAULT_TOP_MAINTENANCE_LIMIT);
        List<TopMaintenanceSpendDto> result = new ArrayList<>();

        for (Object[] row : data) {
            AssetCategory category = parseAssetCategory((String) row[3]);
            result.add(TopMaintenanceSpendDto.builder()
                    .assetId(toUuid(row[0]))
                    .assetName((String) row[1])
                    .assetNumber((String) row[2])
                    .category(category)
                    .categoryDisplayName((String) row[4])
                    .maintenanceCost(toBigDecimal(row[5]))
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "overduePmAssets", key = "'overdue'")
    public List<OverduePmAssetDto> getOverduePmAssets() {
        log.debug("Fetching overdue PM assets");

        List<Object[]> data = assetsDashboardRepository.getOverduePmAssets(DEFAULT_OVERDUE_PM_LIMIT);
        List<OverduePmAssetDto> result = new ArrayList<>();

        for (Object[] row : data) {
            AssetCategory category = parseAssetCategory((String) row[3]);
            Integer daysOverdue = toInteger(row[9]);

            result.add(OverduePmAssetDto.builder()
                    .assetId(toUuid(row[0]))
                    .assetName((String) row[1])
                    .assetNumber((String) row[2])
                    .category(category)
                    .categoryDisplayName((String) row[4])
                    .propertyId(toUuid(row[5]))
                    .propertyName((String) row[6])
                    .lastPmDate(toLocalDate(row[7]))
                    .nextPmDate(toLocalDate(row[8]))
                    .daysOverdue(daysOverdue)
                    .isCritical(daysOverdue != null && daysOverdue > CRITICAL_OVERDUE_DAYS)
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "recentAssets", key = "'recent5'")
    public List<RecentAssetDto> getRecentlyAddedAssets() {
        log.debug("Fetching recently added assets");

        List<Object[]> data = assetsDashboardRepository.getRecentlyAddedAssets(DEFAULT_RECENT_ASSETS_LIMIT);
        List<RecentAssetDto> result = new ArrayList<>();

        for (Object[] row : data) {
            AssetCategory category = parseAssetCategory((String) row[3]);

            result.add(RecentAssetDto.builder()
                    .assetId(toUuid(row[0]))
                    .assetName((String) row[1])
                    .assetNumber((String) row[2])
                    .category(category)
                    .categoryDisplayName((String) row[4])
                    .propertyId(toUuid(row[5]))
                    .propertyName((String) row[6])
                    .addedDate(toLocalDateTime(row[7]))
                    .value(toBigDecimal(row[8]))
                    .build());
        }

        return result;
    }

    @Override
    @Cacheable(value = "depreciationSummary", key = "'summary'")
    public DepreciationSummaryDto getDepreciationSummary() {
        log.debug("Fetching depreciation summary");

        Object[] data = assetsDashboardRepository.getDepreciationSummary();

        if (data == null) {
            return DepreciationSummaryDto.builder()
                    .originalValueTotal(BigDecimal.ZERO)
                    .currentValueTotal(BigDecimal.ZERO)
                    .totalDepreciation(BigDecimal.ZERO)
                    .depreciationPercentage(BigDecimal.ZERO)
                    .totalDepreciableAssets(0L)
                    .fullyDepreciatedAssets(0L)
                    .build();
        }

        return DepreciationSummaryDto.builder()
                .originalValueTotal(toBigDecimal(data[0]))
                .currentValueTotal(toBigDecimal(data[1]))
                .totalDepreciation(toBigDecimal(data[2]))
                .depreciationPercentage(toBigDecimal(data[3]))
                .totalDepreciableAssets(toLong(data[4]))
                .fullyDepreciatedAssets(toLong(data[5]))
                .build();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private UUID toUuid(Object value) {
        if (value == null) return null;
        if (value instanceof UUID) return (UUID) value;
        return UUID.fromString(value.toString());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return ((BigDecimal) value).setScale(2, RoundingMode.HALF_UP);
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Number) return ((Number) value).longValue();
        return 0L;
    }

    private Integer toInteger(Object value) {
        if (value == null) return 0;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate) return (LocalDate) value;
        if (value instanceof java.sql.Date) return ((java.sql.Date) value).toLocalDate();
        return null;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime) return (LocalDateTime) value;
        if (value instanceof Timestamp) return ((Timestamp) value).toLocalDateTime();
        return null;
    }

    private AssetCategory parseAssetCategory(String value) {
        if (value == null) return AssetCategory.OTHER;
        try {
            return AssetCategory.valueOf(value);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown asset category: {}", value);
            return AssetCategory.OTHER;
        }
    }
}
