#!/usr/bin/env tsx

/**
 * Integration Test Runner
 * 
 * This script runs all client-server integration tests in the correct order:
 * 1. Live server unit tests
 * 2. Client-side integration tests
 * 3. End-to-end workflow tests
 * 4. Performance and load tests
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class IntegrationTestRunner {
  private results: TestResult[] = [];
  private liveServerProcess: ChildProcess | null = null;

  async run(): Promise<void> {
    console.log('🚀 Starting Client-Server Integration Tests\n');

    try {
      // Step 1: Start live server for testing
      await this.startLiveServer();

      // Step 2: Run live server integration tests
      await this.runTest(
        'Live Server Integration Tests',
        'npm run test:integration',
        { cwd: 'live-server' }
      );

      // Step 3: Run client-side integration tests
      await this.runTest(
        'Client Integration Tests',
        'npm run test -- src/test/integration/client-server-integration.test.tsx'
      );

      // Step 4: Run end-to-end workflow tests
      await this.runTest(
        'End-to-End Workflow Tests',
        'npm run test -- src/test/e2e/complete-workflow.test.tsx'
      );

      // Step 5: Run performance tests
      await this.runTest(
        'Performance Tests',
        'npm run test -- --reporter=verbose --testTimeout=30000',
        { env: { ...process.env, TEST_MODE: 'performance' } }
      );

      // Step 6: Generate test report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Integration test suite failed:', error);
      process.exit(1);
    } finally {
      // Clean up
      await this.stopLiveServer();
    }
  }

  private async startLiveServer(): Promise<void> {
    console.log('🔧 Starting live server for testing...');

    return new Promise((resolve, reject) => {
      this.liveServerProcess = spawn('npm', ['run', 'dev'], {
        cwd: 'live-server',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: '3001',
          CONVEX_URL: process.env.CONVEX_URL || 'https://test.convex.cloud',
          CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'test-key',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      this.liveServerProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('Live Interaction Server running on port 3001')) {
          console.log('✅ Live server started successfully');
          resolve();
        }
      });

      this.liveServerProcess.stderr?.on('data', (data) => {
        console.error('Live server error:', data.toString());
      });

      this.liveServerProcess.on('error', (error) => {
        reject(new Error(`Failed to start live server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Live server startup timeout'));
      }, 30000);
    });
  }

  private async stopLiveServer(): Promise<void> {
    if (this.liveServerProcess) {
      console.log('🔧 Stopping live server...');
      this.liveServerProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        this.liveServerProcess?.on('exit', resolve);
        setTimeout(resolve, 5000); // Force kill after 5 seconds
      });
      
      console.log('✅ Live server stopped');
    }
  }

  private async runTest(
    name: string,
    command: string,
    options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
  ): Promise<void> {
    console.log(`\n🧪 Running ${name}...`);
    const startTime = Date.now();

    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, {
        cwd: options.cwd || '.',
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;

        this.results.push({
          name,
          passed,
          duration,
          output,
          error: passed ? undefined : errorOutput,
        });

        if (passed) {
          console.log(`✅ ${name} passed (${duration}ms)`);
        } else {
          console.log(`❌ ${name} failed (${duration}ms)`);
          console.log('Error output:', errorOutput);
        }

        resolve();
      });

      process.on('error', (error) => {
        const duration = Date.now() - startTime;
        this.results.push({
          name,
          passed: false,
          duration,
          output,
          error: error.message,
        });

        console.log(`❌ ${name} failed with error: ${error.message}`);
        resolve();
      });
    });
  }

  private async generateReport(): Promise<void> {
    console.log('\n📊 Generating test report...');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        duration: totalDuration,
        timestamp: new Date().toISOString(),
      },
      results: this.results,
    };

    // Write JSON report
    await fs.writeFile(
      'integration-test-report.json',
      JSON.stringify(report, null, 2)
    );

    // Write HTML report
    const htmlReport = this.generateHTMLReport(report);
    await fs.writeFile('integration-test-report.html', htmlReport);

    // Print summary
    console.log('\n📋 Test Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('\n📄 Reports generated:');
    console.log('  - integration-test-report.json');
    console.log('  - integration-test-report.html');

    if (failedTests > 0) {
      process.exit(1);
    }
  }

  private generateHTMLReport(report: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .total { color: #007bff; }
        .duration { color: #6c757d; }
        .results {
            padding: 30px;
        }
        .test-result {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .test-header {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-name {
            font-weight: bold;
            font-size: 16px;
        }
        .test-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-passed {
            background: #d4edda;
            color: #155724;
        }
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-details {
            padding: 20px;
        }
        .test-output {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        .error-output {
            background: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Client-Server Integration Test Report</h1>
            <p>Generated on ${new Date(report.summary.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <p class="value total">${report.summary.total}</p>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <p class="value passed">${report.summary.passed}</p>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <p class="value failed">${report.summary.failed}</p>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <p class="value duration">${(report.summary.duration / 1000).toFixed(1)}s</p>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${report.results.map((result: TestResult) => `
                <div class="test-result">
                    <div class="test-header">
                        <span class="test-name">${result.name}</span>
                        <span class="test-status ${result.passed ? 'status-passed' : 'status-failed'}">
                            ${result.passed ? 'Passed' : 'Failed'}
                        </span>
                    </div>
                    <div class="test-details">
                        <p><strong>Duration:</strong> ${result.duration}ms</p>
                        ${result.error ? `
                            <p><strong>Error:</strong></p>
                            <div class="test-output error-output">${result.error}</div>
                        ` : ''}
                        ${result.output ? `
                            <p><strong>Output:</strong></p>
                            <div class="test-output">${result.output}</div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

// Run the integration tests
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.run().catch((error) => {
    console.error('Integration test runner failed:', error);
    process.exit(1);
  });
}

export { IntegrationTestRunner };