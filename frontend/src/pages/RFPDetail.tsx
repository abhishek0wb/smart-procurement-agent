import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rfpService, vendorService } from '../services/api';

const RFPDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [rfp, setRfp] = useState<any>(null);
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [emailSending, setEmailSending] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [generatingComparison, setGeneratingComparison] = useState(false);
    const [recommendation, setRecommendation] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            if (id) {
                const [rfpRes, vendorRes] = await Promise.all([
                    rfpService.get(id),
                    vendorService.getAll()
                ]);
                setRfp(rfpRes.data);
                setVendors(vendorRes.data);
            }
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVendorToggle = (vendorId: string) => {
        setSelectedVendors(prev =>
            prev.includes(vendorId)
                ? prev.filter(v => v !== vendorId)
                : [...prev, vendorId]
        );
    };

    const handleSendEmail = async () => {
        if (!id) return;
        setEmailSending(true);
        try {
            await rfpService.assignVendors(id, selectedVendors);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccessMsg('RFP sent successfully to selected vendors!');
            fetchData();
            setSelectedVendors([]);
        } catch (err) {
            console.error('Failed to send RFP');
        } finally {
            setEmailSending(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await rfpService.sync();
            setSuccessMsg(`Sync complete! Checked ${res.data.count || 0} emails.`);
            fetchData();
        } catch (err) {
            console.error('Sync failed', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleGenerateComparison = async () => {
        if (!id) return;
        setGeneratingComparison(true);
        try {
            const res = await rfpService.recommend(id);
            setRecommendation(res.data);
        } catch (err) {
            console.error('Failed to generate recommendation', err);
        } finally {
            setGeneratingComparison(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!rfp) return <div className="p-6">RFP not found</div>;

    const connectedVendorIds = rfp.vendors?.map((v: any) => v.id) || [];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{rfp.title}</h1>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        {syncing ? 'Syncing...' : 'Sync Emails'}
                    </button>
                    <button
                        onClick={handleGenerateComparison}
                        disabled={generatingComparison || rfp.vendors.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
                    >
                        {generatingComparison ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                AI Compare
                            </>
                        ) : 'AI Compare'}
                    </button>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${rfp.status === 'SENT' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {rfp.status}
                    </span>
                </div>
            </div>

            {recommendation && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg shadow-lg border border-purple-100 mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-purple-900 flex items-center">
                                ✨ AI Procurement Insights
                            </h2>
                            <p className="text-sm text-purple-700 mt-1">{recommendation.summary}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs uppercase tracking-wide text-purple-500 font-semibold">Recommended Winner</span>
                            <span className="text-2xl font-bold text-green-700">{recommendation.winner}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto mb-6">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                            <thead className="bg-purple-100 text-purple-800 text-xs uppercase">
                                <tr>
                                    <th className="py-3 px-4 text-left">Vendor</th>
                                    <th className="py-3 px-4 text-center">Score</th>
                                    <th className="py-3 px-4 text-left">Pros</th>
                                    <th className="py-3 px-4 text-left">Cons</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {recommendation.comparison.map((c: any, idx: number) => (
                                    <tr key={idx} className={c.vendor === recommendation.winner ? 'bg-green-50' : ''}>
                                        <td className="py-3 px-4 font-medium">{c.vendor}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="inline-block px-2 py-1 rounded bg-gray-100 font-bold text-sm">
                                                {c.score}/100
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-green-700">
                                            <ul className="list-disc pl-4">
                                                {c.pros.map((pro: string, i: number) => <li key={i}>{pro}</li>)}
                                            </ul>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-red-700">
                                            <ul className="list-disc pl-4">
                                                {c.cons.map((con: string, i: number) => <li key={i}>{con}</li>)}
                                            </ul>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-2">Detailed Reasoning</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{recommendation.reasoning}</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                <p className="text-gray-700 mb-4">{rfp.description}</p>

                <h3 className="font-semibold text-lg mb-2">Structured Details</h3>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-60">
                    {JSON.stringify(rfp.structuredData, null, 2)}
                </pre>
            </div>

            {rfp.status === 'DRAFT' || rfp.status === 'SENT' ? (
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-xl font-semibold mb-4">Select Vendors</h2>
                    {successMsg && (
                        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">
                            {successMsg}
                        </div>
                    )}

                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                        {vendors.map((vendor) => {
                            const isConnected = connectedVendorIds.includes(vendor.id);
                            return (
                                <div key={vendor.id} className={`flex items-center p-3 border rounded ${isConnected ? 'bg-blue-50 border-blue-200' : ''}`}>
                                    <input
                                        type="checkbox"
                                        id={vendor.id}
                                        checked={selectedVendors.includes(vendor.id) || isConnected}
                                        onChange={() => !isConnected && handleVendorToggle(vendor.id)}
                                        disabled={isConnected}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={vendor.id} className="ml-3 block w-full cursor-pointer">
                                        <span className="font-medium text-gray-900">{vendor.name}</span>
                                        <span className="text-gray-500 ml-2">({vendor.email})</span>
                                        {isConnected && <span className="ml-2 text-xs text-blue-600 font-semibold">Sent</span>}
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSendEmail}
                        disabled={selectedVendors.length === 0 || emailSending}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                    >
                        {emailSending ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </>
                        ) : (
                            'Send RFP via Email'
                        )}
                    </button>
                </div>
            ) : null}

            {rfp.proposals && rfp.proposals.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-xl font-semibold mb-4">Received Proposals</h2>
                    <div className="space-y-4">
                        {rfp.proposals.map((p: any) => (
                            <div key={p.id} className="border p-4 rounded bg-gray-50">
                                <div className="flex justify-between font-medium mb-2">
                                    <span>{p.vendor?.name || 'Unknown Vendor'}</span>
                                    <span className="text-green-700">{p.price || 'Price Pending'}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                    <p><strong>Timeline:</strong> {p.timeline || 'N/A'}</p>
                                    <p><strong>Terms:</strong> {p.terms || 'N/A'}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap truncate max-h-20">
                                    {p.rawText}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RFPDetail;
