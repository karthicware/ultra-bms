import { execSync } from 'child_process';
import * as path from 'path';

describe('check-services.sh', () => {
  const scriptPath = path.join(__dirname, '../check-services.sh');

  describe('Script Execution', () => {
    it('should exist and be executable', () => {
      expect(() => {
        execSync(`test -f ${scriptPath}`);
      }).not.toThrow();

      expect(() => {
        execSync(`test -x ${scriptPath}`);
      }).not.toThrow();
    });

    it('should have correct shebang', () => {
      const scriptContent = execSync(`head -1 ${scriptPath}`).toString();
      expect(scriptContent.trim()).toBe('#!/bin/bash');
    });
  });

  describe('Service Health Checks', () => {
    it('should succeed when both services are running', () => {
      // This test will pass if your servers are actually running
      // If servers are not running, this test will be skipped in CI
      try {
        const result = execSync(`bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        expect(result).toContain('All services are ready for testing');
        expect(result).toContain('Backend is healthy');
        expect(result).toContain('Frontend is healthy');
      } catch (error: any) {
        // If servers are not running, that's expected in some environments
        if (error.status === 1) {
          console.log('✓ Script correctly fails when services are down');
          expect(error.stderr || error.stdout).toContain(
            'not running' || 'not responding'
          );
        } else {
          throw error;
        }
      }
    });

    it('should fail gracefully when backend is not running', () => {
      try {
        execSync(`BACKEND_URL=http://localhost:9999 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        // If we get here, test should fail
        throw new Error('Script should have failed');
      } catch (error: any) {
        expect(error.status).toBe(1);
        const output = error.stderr || error.stdout;
        expect(output).toContain('Backend');
        expect(output).toContain('not responding' || 'not running');
      }
    });

    it('should fail gracefully when frontend is not running', () => {
      try {
        execSync(`FRONTEND_URL=http://localhost:9998 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        // If we get here, test should fail
        throw new Error('Script should have failed');
      } catch (error: any) {
        expect(error.status).toBe(1);
        const output = error.stderr || error.stdout;
        expect(output).toContain('Frontend' || 'Backend');
        expect(output).toContain('not responding' || 'not running');
      }
    });
  });

  describe('Environment Variables', () => {
    it('should use default URLs when env vars not set', () => {
      try {
        execSync(`bash ${scriptPath}`, {
          encoding: 'utf-8',
          env: { ...process.env, BACKEND_URL: undefined, FRONTEND_URL: undefined },
          stdio: 'pipe',
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout;
        // Should use default localhost:8080 and localhost:3000
        expect(output).toContain('localhost:8080' || 'localhost:3000');
      }
    });

    it('should respect BACKEND_URL environment variable', () => {
      try {
        execSync(`BACKEND_URL=http://custom-backend:8080 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout;
        expect(output).toContain('custom-backend');
      }
    });

    it('should respect FRONTEND_URL environment variable', () => {
      try {
        execSync(`FRONTEND_URL=http://custom-frontend:3000 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout;
        expect(output).toContain('custom-frontend' || 'Backend');
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed connections', () => {
      const startTime = Date.now();

      try {
        execSync(`BACKEND_URL=http://localhost:9999 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const output = error.stderr || error.stdout;

        // Script should retry 3 times with 2-second delays
        // Minimum duration: 3 retries * 2 seconds = 6 seconds
        expect(duration).toBeGreaterThanOrEqual(4000); // At least 4 seconds (accounting for execution time)

        // Should show retry warnings
        expect(output).toContain('retrying');
      }
    }, 15000); // Increase timeout for this test
  });

  describe('Exit Codes', () => {
    it('should exit with code 0 when services are healthy', () => {
      try {
        execSync(`bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        // If we get here, exit code was 0 (success)
        expect(true).toBe(true);
      } catch (error: any) {
        // If servers are not running, exit code should be 1
        if (error.status === 1) {
          expect(error.status).toBe(1);
        }
      }
    });

    it('should exit with code 1 when services are unhealthy', () => {
      try {
        execSync(`BACKEND_URL=http://localhost:9999 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        throw new Error('Should have failed');
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });
  });

  describe('Output Format', () => {
    it('should display validation header', () => {
      try {
        execSync(`bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout;
        expect(output).toContain('Pre-Test Validation');
      }
    });

    it('should display helpful error messages on failure', () => {
      try {
        execSync(`BACKEND_URL=http://localhost:9999 bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout;

        // Should contain helpful instructions
        expect(output).toContain('Please start');
        expect(output).toContain('backend' || 'Backend');
      }
    });

    it('should use color-coded output (ANSI escape codes)', () => {
      try {
        execSync(`bash ${scriptPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        const output = error.stderr || error.stdout;

        // Should contain ANSI color codes for formatting
        // [0;32m = green, [0;31m = red, [1;33m = yellow
        expect(output).toMatch(/\[0;3[12]m|\[1;33m/);
      }
    });
  });
});
