"use client";

import { useState, useEffect } from "react";

export default function TrackerPage() {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadParticipants();
    }, []);

    async function loadParticipants() {
        try {
            const response = await fetch('/data/gcsj.csv');
            const csvText = await response.text();
            
            // Parse CSV line by line with proper field extraction
            const lines = csvText.trim().split('\n');
            
            const data = [];
            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i].trim();
                if (!line) continue;
                
                // Find the URL in the line first
                const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
                if (!urlMatch) {
                    console.warn('No URL found in line:', line);
                    continue;
                }
                
                const url = urlMatch[0];
                const urlIndex = line.indexOf(url);
                
                // Everything before the URL
                const beforeUrl = line.substring(0, urlIndex - 1); // -1 for the comma
                const afterUrl = line.substring(urlIndex + url.length + 1); // +1 for the comma
                
                // Split the part before URL to get rank and name
                const firstCommaIndex = beforeUrl.indexOf(',');
                const rank = beforeUrl.substring(0, firstCommaIndex);
                const name = beforeUrl.substring(firstCommaIndex + 1);
                
                data.push({
                    rank: rank.trim(),
                    name: name.trim(),
                    profileUrl: url.trim(),
                    completionDate: afterUrl.trim()
                });
            }
            
            // console.log('Loaded participants:', data.length, 'records');
            // console.log('First 3 records:', data.slice(0, 3));
            setParticipants(data);
        } catch (error) {
            console.error('Failed to load participants:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredParticipants = participants.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6 mt-8">
                {/* Header */}
                <div className="text-center space-y-3 mb-8">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                        LEADERBOARD
                    </h1>
                    <p className="text-gray-500 text-sm uppercase tracking-widest">
                        Google Cloud Study Jams 2025
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-zinc-700 placeholder-gray-600 text-sm"
                    />
                </div>

                {/* Participants List */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-zinc-800 border-t-white"></div>
                    </div>
                ) : (
                    <div className="bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-900">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Rank</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map((participant, index) => (
                                    <tr
                                        key={participant.rank}
                                        className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors group"
                                    >
                                        {/* Rank */}
                                        <td className="px-4 py-4">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                                                participant.rank === '1' ? 'bg-yellow-500/10 text-yellow-500' :
                                                participant.rank === '2' ? 'bg-gray-400/10 text-gray-400' :
                                                participant.rank === '3' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-zinc-800 text-gray-400'
                                            }`}>
                                                {participant.rank === '1' ? '🥇' :
                                                 participant.rank === '2' ? '🥈' :
                                                 participant.rank === '3' ? '🥉' :
                                                 participant.rank}
                                            </div>
                                        </td>

                                        {/* Name */}
                                        <td className="px-4 py-4">
                                            <span className="text-white font-medium text-sm">
                                                {participant.name}
                                            </span>
                                        </td>

                                        {/* Profile Link */}
                                        <td className="px-4 py-4 text-right">
                                            <a
                                                href={participant.profileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                            >
                                                View
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredParticipants.length === 0 && (
                            <div className="text-center py-16 text-gray-600">
                                <p className="text-sm">No results found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Stats */}
                <div className="text-center pt-6 pb-4">
                    <p className="text-xs text-gray-600">
                        {participants.length} participants
                    </p>
                </div>
            </div>
        </div>
    );
}
