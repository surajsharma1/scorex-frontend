import React from 'react';
import AccessibilityTest from './AccessibilityTest';
import BracketView from './BracketView';

const BracketViewTest: React.FC = () => {
  return (
    <AccessibilityTest componentName="BracketView">
      <BracketView />
    </AccessibilityTest>
  );
};

export default BracketViewTest;
