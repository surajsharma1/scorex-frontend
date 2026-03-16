import { jsx as _jsx } from "react/jsx-runtime";
import AccessibilityTest from './AccessibilityTest';
import BracketView from './BracketView';
const BracketViewTest = () => {
    return (_jsx(AccessibilityTest, { componentName: "BracketView", children: _jsx(BracketView, {}) }));
};
export default BracketViewTest;
