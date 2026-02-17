import * as React from 'react';
import { AppStoreProvider } from './store/AppStore';

describe('Debug Test', () => {
  it('should import AppStoreProvider', () => {
    expect(AppStoreProvider).toBeDefined();
  });
});
