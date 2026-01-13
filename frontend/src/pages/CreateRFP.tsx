import React, { useState } from 'react';
import { rfpService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateRFP = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<any>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await rfpService.analyze(prompt);
            setAnalyzedData(response.data);
        } catch (err) {
            setError('Failed to analyze RFP. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await rfpService.create({
                ...analyzedData,
                description: analyzedData.description || prompt || 'No description provided',
                // Store full JSON as structuredData
                structuredData: analyzedData,
            });
            navigate(`/rfps/${response.data.id}`);
        } catch (err) {
            setError('Failed to save RFP.');
            console.error(err);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setAnalyzedData({ ...analyzedData, [field]: value });
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Create New RFP</h1>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your requirements
                </label>
                <textarea
                    className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 h-40"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. We need 100 laptops for our Bangalore office..."
                />
                <div className="mt-2">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !prompt}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {analyzedData && (
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-xl font-semibold mb-4">Review & Edit Details</h2>

                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                value={analyzedData.title || ''}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Budget</label>
                            <input
                                type="text"
                                value={analyzedData.budget || ''}
                                onChange={(e) => handleInputChange('budget', e.target.value)}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description (Summary)</label>
                            <input
                                type="text"
                                // Fallback or use prompt
                                value={analyzedData.description || prompt.substring(0, 100) + '...'}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="mt-1 w-full p-2 border rounded"
                            />
                            <p className="text-xs text-gray-500 mt-1">This will be used as the main description.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Deadline</label>
                            <input
                                type="text"
                                value={analyzedData.deadline || ''}
                                onChange={(e) => handleInputChange('deadline', e.target.value)}
                                className="mt-1 w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Save & Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateRFP;
