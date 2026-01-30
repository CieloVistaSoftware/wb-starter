/**
 * ISSUES STATUS TRANSITIONS - Compliance Test
 * ============================================
 * Tests all valid status transitions for the issue tracking system.
 * 
 * Status values: pending, in-progress, pending-review, resolved, rejected
 * 
 * Valid transitions:
 * - pending → in-progress (Claude starts working)
 * - pending → pending-review (Claude claims fixed directly)
 * - in-progress → pending-review (Claude claims fixed)
 * - pending-review → resolved (user approves)
 * - pending-review → rejected (user rejects)
 * - rejected → pending (reset to retry)
 */

import { test, expect } from '@playwright/test';

test.describe('Issues Status Transitions: Schema Compliance', () => {
  
  /**
   * Helper: Create a test issue and return its ID
   */
  async function createTestIssue(request: any, prefix: string): Promise<{ issueId: string; cleanup: () => Promise<void> }> {
    const unique = `[BUG] ${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Add issue
    const addRes = await request.post('/api/add-issue', { data: { content: unique } });
    expect(addRes.ok()).toBeTruthy();
    
    // Poll for the issue to appear
    let issue: any = null;
    for (let i = 0; i < 10; i++) {
      const listRes = await request.get('/api/pending-issues?all=true');
      const data = await listRes.json();
      issue = (data.issues || []).find((i: any) => i.description && i.description.includes(unique));
      if (issue) break;
      await new Promise(r => setTimeout(r, 300));
    }
    
    expect(issue, `Issue "${unique}" should appear in pending issues`).toBeTruthy();
    
    return {
      issueId: issue.id,
      cleanup: async () => {
        await request.post('/api/delete-issue', { data: { issueId: issue.id } });
      }
    };
  }
  
  test('pending → in-progress sets status and startedAt timestamp', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'in-progress-test');
    
    try {
      // Transition to in-progress
      const updateRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'in-progress' } 
      });
      expect(updateRes.ok()).toBeTruthy();
      
      const body = await updateRes.json();
      expect(body.success).toBeTruthy();
      expect(body.issue.status).toBe('in-progress');
      expect(body.issue.startedAt).toBeTruthy();
      
      // Verify startedAt is a valid ISO date
      const startedAt = new Date(body.issue.startedAt);
      expect(startedAt.getTime()).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });
  
  test('pending → pending-review (via resolved) sets claimedFixedAt', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'direct-fix-test');
    
    try {
      // Claude marks as fixed directly (skipping in-progress)
      const updateRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'resolved', resolution: 'Fixed directly' } 
      });
      expect(updateRes.ok()).toBeTruthy();
      
      const body = await updateRes.json();
      expect(body.success).toBeTruthy();
      expect(body.issue.status).toBe('pending-review'); // NOT resolved yet
      expect(body.issue.claimedFixedAt).toBeTruthy();
      expect(body.issue.resolution).toBe('Fixed directly');
    } finally {
      await cleanup();
    }
  });
  
  test('in-progress → pending-review preserves startedAt', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'full-flow-test');
    
    try {
      // First: pending → in-progress
      const startRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'in-progress' } 
      });
      expect(startRes.ok()).toBeTruthy();
      const startBody = await startRes.json();
      const originalStartedAt = startBody.issue.startedAt;
      
      // Then: in-progress → pending-review
      const fixRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'resolved', resolution: 'Completed work' } 
      });
      expect(fixRes.ok()).toBeTruthy();
      
      const fixBody = await fixRes.json();
      expect(fixBody.issue.status).toBe('pending-review');
      expect(fixBody.issue.startedAt).toBe(originalStartedAt); // Preserved
      expect(fixBody.issue.claimedFixedAt).toBeTruthy();
    } finally {
      await cleanup();
    }
  });
  
  test('pending-review → resolved (approved) sets resolvedAt', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'approval-test');
    
    try {
      // Setup: pending → pending-review
      await request.post('/api/update-issue', { 
        data: { issueId, status: 'resolved', resolution: 'Test fix' } 
      });
      
      // Approve the fix
      const approveRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'approved' } 
      });
      expect(approveRes.ok()).toBeTruthy();
      
      const body = await approveRes.json();
      expect(body.issue.status).toBe('resolved');
      expect(body.issue.resolvedAt).toBeTruthy();
      
      // Verify resolvedAt is a valid ISO date
      const resolvedAt = new Date(body.issue.resolvedAt);
      expect(resolvedAt.getTime()).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });
  
  test('pending-review → rejected clears timestamps and resolution', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'rejection-test');
    
    try {
      // Setup: pending → in-progress → pending-review
      await request.post('/api/update-issue', { 
        data: { issueId, status: 'in-progress' } 
      });
      await request.post('/api/update-issue', { 
        data: { issueId, status: 'resolved', resolution: 'Attempted fix' } 
      });
      
      // Reject the fix
      const rejectRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'rejected' } 
      });
      expect(rejectRes.ok()).toBeTruthy();
      
      const body = await rejectRes.json();
      expect(body.issue.status).toBe('pending');
      expect(body.issue.claimedFixedAt).toBeFalsy();
      expect(body.issue.resolution).toBeFalsy();
      expect(body.issue.startedAt).toBeFalsy();
    } finally {
      await cleanup();
    }
  });
  
  test('full lifecycle: pending → in-progress → pending-review → resolved', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'lifecycle-test');
    
    try {
      // Step 1: pending → in-progress
      const step1 = await request.post('/api/update-issue', { 
        data: { issueId, status: 'in-progress' } 
      });
      expect((await step1.json()).issue.status).toBe('in-progress');
      
      // Step 2: in-progress → pending-review
      const step2 = await request.post('/api/update-issue', { 
        data: { issueId, status: 'resolved', resolution: 'Full lifecycle fix' } 
      });
      expect((await step2.json()).issue.status).toBe('pending-review');
      
      // Step 3: pending-review → resolved
      const step3 = await request.post('/api/update-issue', { 
        data: { issueId, status: 'approved' } 
      });
      const final = await step3.json();
      expect(final.issue.status).toBe('resolved');
      expect(final.issue.startedAt).toBeTruthy();
      expect(final.issue.claimedFixedAt).toBeTruthy();
      expect(final.issue.resolvedAt).toBeTruthy();
      expect(final.issue.resolution).toBe('Full lifecycle fix');
    } finally {
      await cleanup();
    }
  });
  
  test('rejected → in-progress allows retry', async ({ request }) => {
    const { issueId, cleanup } = await createTestIssue(request, 'retry-test');
    
    try {
      // Setup: go through rejection
      await request.post('/api/update-issue', { data: { issueId, status: 'resolved', resolution: 'First attempt' } });
      await request.post('/api/update-issue', { data: { issueId, status: 'rejected' } });
      
      // Retry: start working again
      const retryRes = await request.post('/api/update-issue', { 
        data: { issueId, status: 'in-progress' } 
      });
      expect(retryRes.ok()).toBeTruthy();
      
      const body = await retryRes.json();
      expect(body.issue.status).toBe('in-progress');
      expect(body.issue.startedAt).toBeTruthy(); // New timestamp
    } finally {
      await cleanup();
    }
  });
});

test.describe('Issues Status Transitions: Schema Validation', () => {
  
  test('pending-issues.schema.json has all required statuses', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.join(process.cwd(), 'src', 'wb-models', 'pending-issues.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const statusEnum = schema.definitions.Issue.properties.status.enum;
    
    expect(statusEnum).toContain('pending');
    expect(statusEnum).toContain('in-progress');
    expect(statusEnum).toContain('pending-review');
    expect(statusEnum).toContain('resolved');
    expect(statusEnum).toContain('rejected');
  });
  
  test('pending-issues.schema.json has startedAt field', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.join(process.cwd(), 'src', 'wb-models', 'pending-issues.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const issueProps = schema.definitions.Issue.properties;
    
    expect(issueProps.startedAt).toBeDefined();
    expect(issueProps.startedAt.type).toContain('string');
    expect(issueProps.startedAt.format).toBe('date-time');
  });
  
  test('pending-issues.schema.json has claimedFixedAt field', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.join(process.cwd(), 'src', 'wb-models', 'pending-issues.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const issueProps = schema.definitions.Issue.properties;
    
    expect(issueProps.claimedFixedAt).toBeDefined();
    expect(issueProps.claimedFixedAt.format).toBe('date-time');
  });
  
  test('pending-issues.schema.json has resolvedAt field', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const schemaPath = path.join(process.cwd(), 'src', 'wb-models', 'pending-issues.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    const issueProps = schema.definitions.Issue.properties;
    
    expect(issueProps.resolvedAt).toBeDefined();
    expect(issueProps.resolvedAt.format).toBe('date-time');
  });
});
