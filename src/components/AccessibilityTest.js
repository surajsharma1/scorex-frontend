import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axe from 'axe-core';
const AccessibilityTest = ({ componentName, children }) => {
    const [results, setResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState('');
    const runAccessibilityTest = async () => {
        setIsRunning(true);
        setError('');
        try {
            const results = await axe.run(document.body, {
                rules: {
                    'color-contrast': { enabled: true },
                    'aria-label': { enabled: true },
                    'aria-describedby': { enabled: true },
                    'aria-live': { enabled: true },
                    'button-name': { enabled: true },
                    'heading-order': { enabled: true },
                    'keyboard': { enabled: true },
                    'focus-order-semantics': { enabled: true }
                }
            });
            const violations = results.violations.map((violation) => ({
                id: violation.id,
                impact: violation.impact || undefined,
                description: violation.description,
                help: violation.help,
                helpUrl: violation.helpUrl,
                nodes: violation.nodes
            }));
            setResults(violations);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Accessibility test failed');
        }
        finally {
            setIsRunning(false);
        }
    };
    useEffect(() => {
        // Run test after component mounts
        const timer = setTimeout(runAccessibilityTest, 1000);
        return () => clearTimeout(timer);
    }, []);
    const getImpactColor = (impact) => {
        switch (impact) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'serious': return 'text-orange-600 bg-orange-50';
            case 'moderate': return 'text-yellow-600 bg-yellow-50';
            case 'minor': return 'text-blue-600 bg-blue-50';
            case 'unknown': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: ["Accessibility Test: ", componentName] }), _jsx("button", { onClick: runAccessibilityTest, disabled: isRunning, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors", children: isRunning ? 'Running...' : 'Run Accessibility Test' })] }) }), error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 m-4", children: _jsx("div", { className: "flex", children: _jsx("div", { className: "ml-3", children: _jsxs("p", { className: "text-sm text-red-700 dark:text-red-300", children: ["Test Error: ", error] }) }) }) })), results.length > 0 && (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700", children: [_jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: _jsxs("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: ["Accessibility Issues Found: ", results.length] }) }), _jsx("div", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: results.map((result, index) => (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(result.impact)}`, children: (result.impact || 'unknown').toUpperCase() }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 dark:text-white", children: result.id }), _jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: result.description }), _jsx("p", { className: "mt-2 text-sm text-gray-500 dark:text-gray-500", children: result.help }), _jsxs("p", { className: "mt-1 text-xs text-gray-400 dark:text-gray-500", children: ["Affected elements: ", result.nodes.length] }), result.helpUrl && (_jsx("a", { href: result.helpUrl, target: "_blank", rel: "noopener noreferrer", className: "mt-2 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300", children: "Learn more \u2192" }))] })] }) }, index))) })] }) })), _jsx("div", { className: "p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700", children: [_jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Component Preview" }) }), _jsx("div", { className: "p-4", children: children })] }) })] }));
};
export default AccessibilityTest;
