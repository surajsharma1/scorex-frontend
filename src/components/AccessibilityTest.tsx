import React, { useEffect, useState } from 'react';
import axe from 'axe-core';

interface AccessibilityTestProps {
  componentName: string;
  children: React.ReactNode;
}

interface AxeResult {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | undefined;
  description: string;
  help: string;
  helpUrl: string;
  nodes: any[];
}

const AccessibilityTest: React.FC<AccessibilityTestProps> = ({ componentName, children }) => {
  const [results, setResults] = useState<AxeResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');

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

      const violations = results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes
      }));

      setResults(violations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accessibility test failed');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run test after component mounts
    const timer = setTimeout(runAccessibilityTest, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getImpactColor = (impact: string | undefined) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'serious': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'minor': return 'text-blue-600 bg-blue-50';
      case 'unknown': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Accessibility Test: {componentName}
          </h1>
          <button
            onClick={runAccessibilityTest}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {isRunning ? 'Running...' : 'Run Accessibility Test'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">Test Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Accessibility Issues Found: {results.length}
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(result.impact)}`}>
                      {result.impact.toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.id}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {result.description}
                      </p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                        {result.help}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Affected elements: {result.nodes.length}
                      </p>
                      {result.helpUrl && (
                        <a
                          href={result.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Component Under Test */}
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Component Preview</h2>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityTest;
