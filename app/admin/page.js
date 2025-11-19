"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { FaSearch, FaRobot, FaPlay, FaFileExcel } from "react-icons/fa";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
// import dynamic from "next/dynamic";

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([
        { id: "rank", desc: false },
        { id: "completion_percentage", desc: true }
    ]);
    const [columnFilters, setColumnFilters] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [redeemedFilter, setRedeemedFilter] = useState("all");
    const [progressFilter, setProgressFilter] = useState("");
    const [progressOperator, setProgressOperator] = useState(">=");
    const [badgesFilter, setBadgesFilter] = useState("");
    const [badgesOperator, setBadgesOperator] = useState(">=");

    // Bot control states
    const [showBotModal, setShowBotModal] = useState(false);
    const [botStatus, setBotStatus] = useState(null);
    const [botApiKey, setBotApiKey] = useState("");
    const [scrapeType, setScrapeType] = useState("active");
    const [botLoading, setBotLoading] = useState(false);
    const [botMessage, setBotMessage] = useState(null);

    // CSV upload states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState(null);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);

        // load data (works for both authenticated and public)
        loadData();
    }, []);

    // Table columns definition
    const columns = useMemo(() => {
        const cols = [];

        // S.no (serial) - visible only to authenticated users
        if (isAuthenticated) {
            cols.push({
                id: "sno",
                header: "S.no",
                cell: ({ row, table }) => {
                    // Use the filtered/sorted row index from the table's row model
                    const rows = table.getRowModel().rows;
                    const currentIndex = rows.findIndex(r => r.id === row.id);
                    return (
                        <div className="text-gray-300 text-sm">{currentIndex + 1}</div>
                    );
                },
                enableHiding: false,
            });
        }

        // Rank (hidden, used for sorting)
        cols.push({
            accessorKey: "rank",
            header: "Rank",
            enableHiding: true,
            sortingFn: (rowA, rowB) => {
                const rankA = rowA.original.rank;
                const rankB = rowB.original.rank;
                if (rankA == null && rankB == null) return 0;
                if (rankA == null) return 1;
                if (rankB == null) return -1;
                return rankA - rankB;
            },
        });

        // Name
        cols.push({
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const isCompleted = (row.original.completion_percentage ?? 0) === 100;
                return (
                    <div className="font-semibold text-white flex items-center gap-2">
                        <span>{row.original.name}</span>
                    </div>
                );
            },
        });

        // Badges
        cols.push({
            accessorKey: "completed_badges",
            header: "Badges",
            cell: ({ row }) => {
                const isCompleted = (row.original.completion_percentage ?? 0) === 100;
                const isHigh = (row.original.completion_percentage ?? 0) >= 75;
                const isMedium = (row.original.completion_percentage ?? 0) >= 50;
                return (
                    <div className="text-start font-mono">
                        <span className={`font-bold ${isCompleted ? 'text-emerald-400' : isHigh ? 'text-cyan-400' : isMedium ? 'text-amber-400' : 'text-gray-400'}`}>
                            {row.original.completed_badges ?? 0}
                        </span>
                        <span className="text-gray-500 text-sm">/{row.original.total_badges ?? 0}</span>
                    </div>
                );
            },
        });

        // Progress
        cols.push({
            accessorKey: "completion_percentage",
            header: "Progress",
            cell: ({ row }) => {
                const percentage = row.original.completion_percentage ?? 0;
                const isCompleted = percentage === 100;
                const isHigh = percentage >= 75;
                const isMedium = percentage >= 50;
                return (
                    <div className="text-start">
                        <span className={`font-bold ${isCompleted ? 'text-emerald-400' : isHigh ? 'text-cyan-400' : isMedium ? 'text-amber-400' : 'text-gray-400'}`}>
                            {percentage}%
                        </span>
                    </div>
                );
            },
        });

        // Admin-only columns
        if (isAuthenticated) {
            cols.push({
                accessorKey: "access_code_redeemed",
                header: "Redeemed",
                cell: ({ row }) => (
                    <div className="text-start">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.original.access_code_redeemed ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                            {row.original.access_code_redeemed ? 'Yes' : 'No'}
                        </span>
                    </div>
                ),
            });

            cols.push({
                accessorKey: "completion_date",
                header: "Completion Date",
                cell: ({ row }) => {
                    const completionDate = row.original.completion_date || row.original.completed_at;
                    if (!completionDate) {
                        const fallback = row.original.completion_percentage === 100 ? 'Recently' : '-';
                        return <div className="text-start text-gray-400 text-sm">{fallback}</div>;
                    }
                    
                    // Convert UTC to IST by adding 5 hours 30 minutes
                    const utcDate = new Date(completionDate);
                    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
                    
                    const date = istDate.toLocaleString('en-IN', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return <div className="text-start text-gray-400 text-sm">{date}</div>;
                },
            });
        }

        // Actions
        cols.push({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="text-start">
                    <button onClick={() => openModal(row.original.id)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">View</button>
                </div>
            ),
        });

        return cols;
    }, [isAuthenticated]);

    // Apply custom filters
    const filteredData = useMemo(() => {
        let filtered = [...participants];

        // Redeemed filter
        if (isAuthenticated && redeemedFilter !== "all") {
            filtered = filtered.filter(p => 
                redeemedFilter === "yes" ? p.access_code_redeemed : !p.access_code_redeemed
            );
        }

        // Progress filter
        if (progressFilter !== "") {
            const targetProgress = parseFloat(progressFilter);
            filtered = filtered.filter(p => {
                const progress = p.completion_percentage ?? 0;
                switch (progressOperator) {
                    case ">=": return progress >= targetProgress;
                    case "<=": return progress <= targetProgress;
                    case "=": return progress === targetProgress;
                    case ">": return progress > targetProgress;
                    case "<": return progress < targetProgress;
                    default: return true;
                }
            });
        }

        // Badges filter
        if (badgesFilter !== "") {
            const targetBadges = parseInt(badgesFilter);
            filtered = filtered.filter(p => {
                const badges = p.completed_badges ?? 0;
                switch (badgesOperator) {
                    case ">=": return badges >= targetBadges;
                    case "<=": return badges <= targetBadges;
                    case "=": return badges === targetBadges;
                    case ">": return badges > targetBadges;
                    case "<": return badges < targetBadges;
                    default: return true;
                }
            });
        }

        return filtered;
    }, [participants, isAuthenticated, redeemedFilter, progressFilter, progressOperator, badgesFilter, badgesOperator]);

    // Table instance
    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter,
            columnVisibility: {
                rank: false, // Hide rank column
            },
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableMultiSort: true,
        initialState: {
            sorting: [
                { id: "rank", desc: false },
                { id: "completion_percentage", desc: true }
            ],
        },
    });

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            // Fetch stats and participants in parallel
            const [statsRes, participantsRes] = await Promise.allSettled([
                apiClient.get("/api/stats"),
                apiClient.get("/api/participants"),
            ]);

            // Handle stats response
            if (statsRes.status === "fulfilled") {
                setStats(statsRes.value.data);
            } else {
                console.error("Failed to load stats:", statsRes.reason);
                setStats({
                    total_participants: 0,
                    redeemed_count: 0,
                    completed_all_count: 0,
                    average_completion: 0
                });
            }

            // Handle participants response
            if (participantsRes.status === "fulfilled") {
                const raw = participantsRes.value.data || [];

                // Map participants to ensure we have completed/total and percentage calculated
                const mapped = raw.map((p) => {
                    const badges = Array.isArray(p.badges) ? p.badges : [];

                    // Determine total badges: prefer explicit total_badges if available
                    const totalBadges = typeof p.total_badges === 'number' ? p.total_badges : badges.length;

                    // Determine completed count: prefer counting badges array if present, otherwise use provided completed_badges
                    let completedCount = 0;
                    if (badges.length > 0) {
                        completedCount = badges.filter((b) => b && (b.completed === true || b.done === true)).length;
                    } else if (typeof p.completed_badges === 'number') {
                        completedCount = p.completed_badges;
                    }

                    // Guard totalBadges to avoid division by zero
                    const percentage = totalBadges > 0 ? Math.round((completedCount / totalBadges) * 100) : (typeof p.completion_percentage === 'number' ? p.completion_percentage : 0);

                    return {
                        ...p,
                        completed_badges: completedCount,
                        total_badges: totalBadges,
                        completion_percentage: percentage,
                    };
                });

                setParticipants(mapped);
            } else {
                console.error("Failed to load participants:", participantsRes.reason);
                setParticipants([]);
            }
        } catch (err) {
            console.error("Error loading data:", err);
            setError("Failed to load data from server");
            setStats({
                total_participants: 0,
                redeemed_count: 0,
                completed_all_count: 0,
                average_completion: 0
            });
            setParticipants([]);
        } finally {
            setLoading(false);
        }
    }

    async function openModal(participantId) {
        try {
            const response = await apiClient.get(`/api/participants/${participantId}`);
            setSelectedParticipant(response.data);
        } catch (err) {
            console.error("Failed to load participant details:", err);
            alert("Failed to load participant details");
        }
    }

    // Bot control functions
    async function checkBotStatus() {
        if (!botApiKey) return;

        try {
            const response = await apiClient.get("/api/bot/status", {
                headers: { "X-API-Key": botApiKey }
            });
            setBotStatus(response.data);
        } catch (err) {
            console.error("Failed to check bot status:", err);
        }
    }

    async function triggerBot() {
        if (!botApiKey) {
            setBotMessage({ type: "error", text: "Please enter Bot API Key" });
            return;
        }

        setBotLoading(true);
        setBotMessage(null);

        try {
            const response = await apiClient.post(`/api/bot/trigger?scrape_type=${scrapeType}`, null, {
                headers: { "X-API-Key": botApiKey }
            });

            setBotMessage({ type: "success", text: response.data.message || "Bot started successfully" });

            // Save API key for next time
            localStorage.setItem("bot_api_key", botApiKey);

            // Poll for status updates
            const interval = setInterval(async () => {
                await checkBotStatus();

                // Check if bot is still running
                const statusRes = await apiClient.get("/api/bot/status", {
                    headers: { "X-API-Key": botApiKey }
                });

                if (!statusRes.data.is_running) {
                    clearInterval(interval);
                    setBotLoading(false);
                    setBotMessage({ type: "success", text: "Scraping completed! Refreshing data..." });
                    await loadData(); // Refresh participant data
                }
            }, 3000);

            // Stop polling after 5 minutes max
            setTimeout(() => {
                clearInterval(interval);
                setBotLoading(false);
            }, 300000);

        } catch (err) {
            setBotLoading(false);
            setBotMessage({
                type: "error",
                text: err.response?.data?.detail || "Failed to start bot. Please try again."
            });
        }
    }

    function openBotModal() {
        setShowBotModal(true);
        const savedKey = localStorage.getItem("bot_api_key");
        if (savedKey) {
            setBotApiKey(savedKey);
        }
        checkBotStatus();
    }

    function closeBotModal() {
        setShowBotModal(false);
        setBotMessage(null);
    }

    // CSV Upload functions
    async function handleUploadCSV() {
        if (!uploadFile) {
            setUploadMessage({ type: "error", text: "Please select a CSV file" });
            return;
        }

        setUploadLoading(true);
        setUploadMessage(null);

        const formData = new FormData();
        formData.append("file", uploadFile);

        try {
            const response = await apiClient.post("/api/admin/upload-csv", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setUploadMessage({
                type: "success",
                text: `${response.data.message}. Added: ${response.data.added}, Updated: ${response.data.updated}`,
            });

            // Refresh data after upload
            setTimeout(async () => {
                await loadData();
                setShowUploadModal(false);
                setUploadFile(null);
            }, 2000);
        } catch (err) {
            setUploadMessage({
                type: "error",
                text: err.response?.data?.detail || "Failed to upload CSV. Please try again.",
            });
        } finally {
            setUploadLoading(false);
        }
    }

    function openUploadModal() {
        setShowUploadModal(true);
        setUploadFile(null);
        setUploadMessage(null);
    }

    function closeUploadModal() {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadMessage(null);
    }

    // Export to Excel function
    async function exportToExcel() {
        try {
            // Dynamically import xlsx to avoid SSR issues
            const XLSX = await import('xlsx');
            
            // Prepare data for export
            const exportData = participants.map((p, index) => ({
                'S.No': index + 1,
                'Rank': p.rank || 'N/A',
                'Name': p.name || '',
                'Email': p.email || '',
                'Completed Badges': p.completed_badges || 0,
                'Total Badges': p.total_badges || 0,
                'Completion %': p.completion_percentage || 0,
                'Bot Time Stamp %': p.completion_date || 0,
                'Access Code Redeemed': p.access_code_redeemed ? 'Yes' : 'No',
                // 'Last Updated': p.updated_at ? new Date(p.updated_at).toLocaleString('en-US', {
                //     year: 'numeric',
                //     month: 'sshort',
                //     day: 'numeric',
                //     hour: '2-digit',
                //     minute: '2-digit'
                // }) : 'Never',
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Set column widths
            ws['!cols'] = [
                { wch: 6 },  // S.No
                { wch: 25 }, // Name
                { wch: 30 }, // Email
                { wch: 15 }, // Completed Badges
                { wch: 12 }, // Total Badges
                { wch: 12 }, // Completion %
                { wch: 18 }, // Access Code Redeemed
                { wch: 20 }, // Last Updated
                { wch: 8 }   // Rank
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Participants');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `GDG_Participants_${timestamp}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export data. Please try again.');
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("first_name");
        router.push("/admin/login");
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 mt-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            {isAuthenticated ? "Admin Dashboard" : "Google Cloud Study Jams Leaderboard"}
                        </h1>
                        <p className="text-gray-400 mt-2">
                            {isAuthenticated ? "Manage participant progress" : "View participant progress"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={openUploadModal}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                                >
                                    <span>📄</span>
                                    <span className="hidden sm:inline">Upload CSV</span>
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                                >
                                    <FaFileExcel className="text-lg" />
                                    <span className="hidden sm:inline">Export</span>
                                </button>
                                <button
                                    onClick={openBotModal}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                                >
                                    <FaRobot className="text-lg" />
                                    <span className="hidden sm:inline">Bot</span>
                                </button>
                                <button
                                    onClick={loadData}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <></>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Live Completion Bar - For All Users */}
                {participants.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-emerald-400">
                                        {participants.filter(p => p.completion_percentage === 100).length}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">Completed</div>
                                </div>
                                <div className="text-gray-500 text-3xl">/</div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-indigo-300">
                                        {participants.length}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">Total</div>
                                </div>
                            </div>
                            <div className="flex-1 w-full md:w-auto md:max-w-md">
                                <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                    <div 
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500 flex items-center justify-center"
                                        style={{ 
                                            width: `${participants.length > 0 ? (participants.filter(p => p.completion_percentage === 100).length / participants.length * 100) : 0}%` 
                                        }}
                                    >
                                        <span className="text-xs font-bold text-white drop-shadow-lg">
                                            {participants.length > 0 ? Math.round(participants.filter(p => p.completion_percentage === 100).length / participants.length * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center text-xs text-gray-500 mt-2">
                                    Live Completion Progress
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards - Admin Only */}
                {isAuthenticated && stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500/20">
                            <div className="text-blue-200 text-sm font-medium mb-1">Total</div>
                            <div className="text-4xl font-bold text-white">{stats.total_participants}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 border border-green-500/20">
                            <div className="text-green-200 text-sm font-medium mb-1">Redeemed</div>
                            <div className="text-4xl font-bold text-white">{stats.redeemed_count}</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500/20">
                            <div className="text-purple-200 text-sm font-medium mb-1">Completed</div>
                            <div className="text-4xl font-bold text-white">{stats.completed_all_count}</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 border border-orange-500/20">
                            <div className="text-orange-200 text-sm font-medium mb-1">Avg %</div>
                            <div className="text-4xl font-bold text-white">{stats.average_completion}%</div>
                        </div>
                    </div>
                )}

                {/* Table Card */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm">
                    {/* Search and Filter Toggle */}
                    <div className="py-2 px-2 flex items-center justify-between gap-4 mb-4">
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search participants..."
                                value={globalFilter ?? ""}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                showFilters
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            🔍 Filters
                        </button>
                        <div className="text-gray-400 text-sm font-medium">
                            {table.getFilteredRowModel().rows.length} participants
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="px-2 pb-4 border-b border-gray-800">
                            <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                                <h3 className="text-white font-semibold mb-3">Advanced Filters</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Redeemed Filter - Admin Only */}
                                    {isAuthenticated && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                                Redeemed Status
                                            </label>
                                            <select
                                                value={redeemedFilter}
                                                onChange={(e) => setRedeemedFilter(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="all">All</option>
                                                <option value="yes">Yes</option>
                                                <option value="no">No</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Progress Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                            Progress %
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={progressOperator}
                                                onChange={(e) => setProgressOperator(e.target.value)}
                                                className="w-20 px-2 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value=">=">&gt;=</option>
                                                <option value="<=">&lt;=</option>
                                                <option value="=">=</option>
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="e.g., 75"
                                                value={progressFilter}
                                                onChange={(e) => setProgressFilter(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Badges Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                            Completed Badges
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={badgesOperator}
                                                onChange={(e) => setBadgesOperator(e.target.value)}
                                                className="w-20 px-2 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value=">=">&gt;=</option>
                                                <option value="<=">&lt;=</option>
                                                <option value="=">=</option>
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g., 10"
                                                value={badgesFilter}
                                                onChange={(e) => setBadgesFilter(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                <button
                                    onClick={() => {
                                        setRedeemedFilter("all");
                                        setProgressFilter("");
                                        setBadgesFilter("");
                                    }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="text-gray-400 my-2 p-2">
                        <span>Data may take up to 6 hours to update.</span>
                    </p>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-indigo-500"></div>
                            <p className="mt-4 text-gray-400">Loading...</p>
                        </div>
                    ) : table.getFilteredRowModel().rows.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            {globalFilter ? "No participants match your search" : "No participants available"}
                        </div>
                    ) : (
                        <div className="border-gray-800 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="border-gray-800 hover:bg-gray-800/50">
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className="text-gray-400 font-semibold cursor-pointer hover:text-gray-200"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                        {{
                                                            asc: " ↑",
                                                            desc: " ↓",
                                                        }[header.column.getIsSorted()] ?? null}
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="border-gray-800 hover:bg-gray-800/30 transition-colors"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-4">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Participant Details Dialog */}
            <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {selectedParticipant?.completion_percentage === 100 && <span className="text-lg">🏆</span>}
                            {selectedParticipant?.name}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm">
                            Performance Overview & Badge Details
                        </DialogDescription>
                    </DialogHeader>

                    {selectedParticipant && (
                        <div className="space-y-4 mt-3">
                            {/* Data Update Note */}
                            <div className="bg-amber-950/30 border border-amber-700/50 rounded-lg p-3">
                                <p className="text-amber-200 text-xs flex items-center gap-2">
                                    {/* <span>⏰</span> */}
                                    <span>Data may take up to 6 hours to update.</span>
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-center border border-blue-500/20">
                                    <div className="text-blue-200 text-xs font-medium mb-1">Total Badges</div>
                                    <div className="text-2xl font-bold">{selectedParticipant.total_badges ?? 0}</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-center border border-green-500/20">
                                    <div className="text-green-200 text-xs font-medium mb-1">Completed</div>
                                    <div className="text-2xl font-bold">{selectedParticipant.completed_badges ?? 0}</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 text-center border border-purple-500/20">
                                    <div className="text-purple-200 text-xs font-medium mb-1">Progress</div>
                                    <div className="text-2xl font-bold">{selectedParticipant.completion_percentage ?? 0}%</div>
                                </div>
                            </div>

                            {/* Profile Link */}
                            {selectedParticipant.profile_url && (
                                <div className="text-center">
                                    <a
                                        href={selectedParticipant.profile_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View Public Profile
                                    </a>
                                </div>
                            )}

                            {/* Badge Lists */}
                            {selectedParticipant.badges && selectedParticipant.badges.length > 0 && (
                                <div className="space-y-6">
                                    {/* Skill Badges */}
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                            <span className="text-xl"></span>
                                            Skill Badges
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedParticipant.badges
                                                .filter((b) => b.badge_type === "skill_badge")
                                                .map((badge, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${badge.completed
                                                            ? "bg-green-950/30 border-green-700/50"
                                                            : "bg-gray-800/50 border-gray-700"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <span className="text-xl">{badge.completed ? "" : "⏳"}</span>
                                                            <span className={`text-sm ${badge.completed ? "font-semibold" : "text-gray-400"}`}>
                                                                {badge.name}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`px-3 py-1 rounded-md text-xs font-bold ${badge.completed
                                                                ? "bg-green-600 text-white"
                                                                : "bg-amber-600 text-white"
                                                                }`}
                                                        >
                                                            {badge.completed ? "✓ Done" : "Pending"}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Arcade Games */}
                                    {selectedParticipant.badges.filter((b) => b.badge_type === "arcade_game").length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                                <span className="text-xl"></span>
                                                Arcade Games 
                                            </h3>
                                            <div className="space-y-2">
                                                {(() => {
                                                    const arcadeGames = selectedParticipant.badges.filter((b) => b.badge_type === "arcade_game");
                                                    const completedCount = arcadeGames.filter(b => b.completed).length;
                                                    
                                                    return arcadeGames.map((badge, idx) => {
                                                        // If one is already completed, mark remaining as "Not Required"
                                                        const isNotRequired = completedCount >= 1 && !badge.completed;
                                                        
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                                                    badge.completed
                                                                        ? "bg-green-950/30 border-green-700/50"
                                                                        : isNotRequired
                                                                        ? "bg-gray-900/30 border-gray-700/30"
                                                                        : "bg-gray-800/50 border-gray-700"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <span className="text-xl">
                                                                        {badge.completed ? "✅" : isNotRequired ? "➖" : "⏳"}
                                                                    </span>
                                                                    <span className={`text-base ${
                                                                        badge.completed 
                                                                            ? "font-semibold" 
                                                                            : isNotRequired 
                                                                            ? "text-gray-500 line-through" 
                                                                            : "text-gray-400"
                                                                    }`}>
                                                                        {badge.name}
                                                                    </span>
                                                                </div>
                                                                <span
                                                                    className={`px-3 py-1 rounded-md text-xs font-bold ${
                                                                        badge.completed
                                                                            ? "bg-green-600 text-white"
                                                                            : isNotRequired
                                                                            ? "bg-gray-600 text-gray-300"
                                                                            : "bg-amber-600 text-white"
                                                                    }`}
                                                                >
                                                                    {badge.completed ? "✓ Done" : isNotRequired ? "Not Required" : "Pending"}
                                                                </span>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bot Control Modal */}
            {showBotModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeBotModal}>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-linear-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl border-b border-purple-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaRobot className="text-2xl text-white" />
                                    <h2 className="text-2xl font-bold text-white">Bot Control</h2>
                                </div>
                                <button
                                    onClick={closeBotModal}
                                    className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Bot Status */}
                            {botStatus && (
                                <div className={`p-4 rounded-lg border ${botStatus.is_running
                                    ? "border-yellow-600 bg-yellow-950/30"
                                    : "border-green-600 bg-green-950/30"
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-white">Status</h3>
                                        <span className={`px-3 py-1 rounded-md text-sm font-semibold ${botStatus.is_running
                                            ? "bg-yellow-600 text-white"
                                            : "bg-green-600 text-white"
                                            }`}>
                                            {botStatus.is_running ? "⚡ Running" : "✓ Ready"}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        {botStatus.is_running ? "Bot is scraping..." : "Bot is ready"}
                                    </p>
                                    {botStatus.last_run && (
                                        <p className="text-gray-500 text-xs mt-2">
                                            Last: {new Date(botStatus.last_run).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* API Key */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Bot API Key
                                </label>
                                <input
                                    type="password"
                                    value={botApiKey}
                                    onChange={(e) => setBotApiKey(e.target.value)}
                                    placeholder="Enter API key"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                                />
                            </div>

                            {/* Scrape Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Scrape Type
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: "active", label: "Active", emoji: "✅", desc: "Redeemed" },
                                        { value: "inactive", label: "Inactive", emoji: "⏸️", desc: "Not redeemed" },
                                        { value: "all", label: "All", emoji: "🌐", desc: "Everyone" },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setScrapeType(type.value)}
                                            className={`px-4 py-3 border-2 rounded-lg transition-colors ${scrapeType === type.value
                                                ? "border-purple-500 bg-purple-950/50"
                                                : "border-gray-700 hover:border-purple-500 bg-gray-800/50"
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{type.emoji}</div>
                                            <div className="text-sm font-semibold text-white">{type.label}</div>
                                            <div className="text-xs text-gray-400">{type.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            {botMessage && (
                                <div className={`p-4 rounded-lg border-l-4 ${botMessage.type === "success"
                                    ? "bg-green-950/30 border-green-600"
                                    : "bg-red-950/30 border-red-600"
                                    }`}>
                                    <p className={`text-sm ${botMessage.type === "success" ? "text-green-200" : "text-red-200"
                                        }`}>
                                        {botMessage.text}
                                    </p>
                                </div>
                            )}

                            {/* Trigger Button */}
                            <button
                                onClick={triggerBot}
                                disabled={botLoading || !botApiKey}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {botLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span>Scraping...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaPlay />
                                        <span>Start Scraping</span>
                                    </>
                                )}
                            </button>

                            {/* Last Result */}
                            {botStatus?.last_result && (
                                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                    <h3 className="font-bold text-white mb-2">Last Result</h3>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        {botStatus.last_result.status === "completed" ? (
                                            <>
                                                <p><span className="text-gray-400">Status:</span> <span className="text-green-400 font-semibold">✓ Completed</span></p>
                                                <p><span className="text-gray-400">Total:</span> {botStatus.last_result.total}</p>
                                                <p><span className="text-gray-400">Success:</span> <span className="text-green-400">{botStatus.last_result.success}</span></p>
                                                <p><span className="text-gray-400">Failed:</span> <span className="text-red-400">{botStatus.last_result.failed}</span></p>
                                                <p><span className="text-gray-400">Time:</span> {botStatus.last_result.elapsed_seconds}s</p>
                                            </>
                                        ) : (
                                            <p className="text-red-400">
                                                <span className="font-semibold">Error:</span> {botStatus.last_result.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeUploadModal}>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-linear-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl border-b border-green-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📄</span>
                                    <h2 className="text-2xl font-bold text-white">Upload CSV</h2>
                                </div>
                                <button
                                    onClick={closeUploadModal}
                                    className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* File Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Select CSV File
                                </label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Upload a CSV file with participant data. Format: name, email, etc.
                                </p>
                            </div>

                            {/* Message */}
                            {uploadMessage && (
                                <div className={`p-4 rounded-lg border-l-4 ${
                                    uploadMessage.type === "success"
                                        ? "bg-green-950/30 border-green-600"
                                        : "bg-red-950/30 border-red-600"
                                }`}>
                                    <p className={`text-sm ${
                                        uploadMessage.type === "success" ? "text-green-200" : "text-red-200"
                                    }`}>
                                        {uploadMessage.text}
                                    </p>
                                </div>
                            )}

                            {/* Upload Button */}
                            <button
                                onClick={handleUploadCSV}
                                disabled={uploadLoading || !uploadFile}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploadLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📤</span>
                                        <span>Upload CSV</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export const dynamic = 'force-dynamic';