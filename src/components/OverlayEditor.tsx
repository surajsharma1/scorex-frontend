import { useState } from 'react';
import { Download, Eye } from 'lucide-react';

export default function OverlayEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState('score');
  const [customText, setCustomText] = useState('Match Score');
  const [backgroundColor, setBackgroundColor] = useState('#1f2937');
  const [textColor, setTextColor] = useState('#ffffff');

  const templates = [
    { id: 'score', name: 'Score Overlay', description: 'Display current match score' },
    { id: 'bracket', name: 'Bracket Overlay', description: 'Show tournament bracket' },
    { id: 'stats', name: 'Player Stats', description: 'Highlight player statistics' },
    { id: 'logo', name: 'Team Logo', description: 'Display team logos and names' },
  ];

  const handleDownload = () => {
    // Placeholder for download functionality
    alert('Download functionality will be implemented soon!');
  };

  const handlePreview = () => {
    // Placeholder for preview functionality
    alert('Preview functionality will be implemented soon!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Overlay Editor</h1>
          <p className="text-gray-600 mt-2">
            Create custom overlays for live streaming
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handlePreview}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-5 h-5" />
            <span>Preview</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Template Selection</h2>
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customization</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Text
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-12 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Text Color
              </label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-12 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Preview</h2>
        <div
          className="w-full h-64 rounded-lg flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor, color: textColor }}
        >
          {customText}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-3">Overlay Features</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Multiple template options for different use cases</li>
          <li>✓ Customizable colors and text</li>
          <li>✓ Real-time preview</li>
          <li>✓ Export in multiple formats</li>
          <li>✓ Integration with live streaming software</li>
        </ul>
      </div>
    </div>
  );
}