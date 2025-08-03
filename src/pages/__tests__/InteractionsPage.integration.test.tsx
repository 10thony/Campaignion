import { describe, it, expect } from 'vitest';

describe('InteractionsPage Integration', () => {
  it('should have all required exports', () => {
    // Test that the InteractionsPage component can be imported
    const InteractionsPageModule = require('../InteractionsPage');
    expect(InteractionsPageModule.InteractionsPage).toBeDefined();
    expect(typeof InteractionsPageModule.InteractionsPage).toBe('function');
  });

  it('should have proper component structure', () => {
    // Test that the component has the expected structure
    const { InteractionsPage } = require('../InteractionsPage');
    
    // Check that it's a React component
    expect(InteractionsPage).toBeDefined();
    expect(typeof InteractionsPage).toBe('function');
    
    // Component should have a name
    expect(InteractionsPage.name).toBe('InteractionsPage');
  });
});

describe('Convex Interactions Queries', () => {
  it('should have all required query exports', () => {
    // Test that the Convex queries can be imported
    const interactionsModule = require('../../../convex/interactions');
    
    expect(interactionsModule.getUserInteractions).toBeDefined();
    expect(interactionsModule.getInteractionWithLiveStatus).toBeDefined();
    expect(interactionsModule.updateInteractionStatus).toBeDefined();
    expect(interactionsModule.getAllInteractionsWithLiveStatus).toBeDefined();
  });
});

describe('App Navigation Integration', () => {
  it('should include interactions in navigation', () => {
    const AppModule = require('../../App');
    const appSource = AppModule.default.toString();
    
    // Check that interactions is included in the navigation
    expect(appSource).toContain('interactions');
    expect(appSource).toContain('InteractionsPage');
  });
});