# Quick Start: Testing Guide

## 🚨 CRITICAL: Start Frontend First!

**All 254 test failures were caused by the frontend not running.**

## ✅ How to Run Tests (3 Steps)

### Step 1: Start Frontend
```bash
npm run dev
```

**Wait for:**
```
✓ Ready in 2.5s
- Local: http://localhost:3000
```

### Step 2: Verify Frontend is Running
```bash
curl http://localhost:3000
```
**Should return:** HTML (not "Connection refused")

### Step 3: Run Tests
```bash
# Run all tests (Chrome-only, ~2-3 min)
npm run test:e2e

# Or run UI tests only (~30sec)
npm run test:e2e -- ui-only.spec.ts
```

---

## 📊 What to Expect

### UI-Only Tests (No Backend)
```
Running 17 tests using 4 workers
  17 passed (30s)
```

### All Tests (With Backend)
```
Running 117 tests using 4 workers
  ~110+ passed (2-3 min)
  ~5-10 may need investigation
```

---

## 🔧 What's Been Fixed

✅ Chrome-only configuration (3x faster)
✅ Backend health check URL
✅ All test selectors
✅ UserFactory backend detection
✅ Test documentation

---

## 📁 Test Files

- `ui-only.spec.ts` - 17 tests (no backend needed)
- `login.spec.ts` - ~20 tests
- `registration.spec.ts` - ~25 tests
- `password-reset.spec.ts` - ~15 tests
- `session-management.spec.ts` - ~20 tests
- `protected-routes.spec.ts` - ~20 tests

**Total:** ~117 tests (Chrome-only)

---

## 🐛 If Tests Still Fail

1. **Verify frontend is running:**
   ```bash
   lsof -i :3000
   ```
   Should show `node` process

2. **Verify backend is running:**
   ```bash
   curl http://localhost:8080/actuator/health
   ```
   Should return `{"status":"UP"}`

3. **Clear test cache:**
   ```bash
   rm -rf test-results playwright-report
   npm run test:e2e
   ```

4. **Check browser:**
   ```bash
   npx playwright install chromium
   ```

---

## 📖 Full Documentation

- **Detailed Summary:** `TEST-SUMMARY.md`
- **Test Status:** `TESTING-STATUS.md`
- **README Testing:** `README.md#testing`

---

## 🎯 TL;DR

```bash
# 1. Start frontend
npm run dev

# 2. Run tests
npm run test:e2e

# Done! 🎉
```
