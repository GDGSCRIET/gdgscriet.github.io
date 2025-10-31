"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { FaSearch, FaRobot, FaPlay } from "react-icons/fa";
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

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([{ id: "completion_percentage", desc: true }]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Bot control states
    const [showBotModal, setShowBotModal] = useState(false);
    const [botStatus, setBotStatus] = useState(null);
    const [botApiKey, setBotApiKey] = useState("");
    const [scrapeType, setScrapeType] = useState("active");
    const [botLoading, setBotLoading] = useState(false);
    const [botMessage, setBotMessage] = useState(null);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);

        // load data (works for both authenticated and public)
        loadData();
    }, []);

    // Table columns definition
    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => {
                    const isCompleted = (row.original.completion_percentage ?? 0) === 100;
                    return (
                        <div className="font-semibold text-white flex items-center gap-2">
                            {/* {isCompleted && <span className="text-xl">🏆</span>} */}
                            <span>{row.original.name}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "completed_badges",
                header: "Badges",
                cell: ({ row }) => {
                    const isCompleted = (row.original.completion_percentage ?? 0) === 100;
                    const isHigh = (row.original.completion_percentage ?? 0) >= 75;
                    const isMedium = (row.original.completion_percentage ?? 0) >= 50;

                    return (
                        <div className="text-start font-mono">
                            <span className={`font-bold ${isCompleted ? 'text-emerald-400' :
                                isHigh ? 'text-cyan-400' :
                                    isMedium ? 'text-amber-400' :
                                        'text-gray-400'
                                }`}>
                                {row.original.completed_badges ?? 0}
                            </span>
                            <span className="text-gray-500 text-sm">/{row.original.total_badges ?? 0}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "completion_percentage",
                header: "Progress",
                cell: ({ row }) => {
                    const percentage = row.original.completion_percentage ?? 0;
                    const isCompleted = percentage === 100;
                    const isHigh = percentage >= 75;
                    const isMedium = percentage >= 50;

                    return (
                        <div className="text-start">
                            <span className={`font-bold ${isCompleted ? 'text-emerald-400' :
                                isHigh ? 'text-cyan-400' :
                                    isMedium ? 'text-amber-400' :
                                        'text-gray-400'
                                }`}>
                                {percentage}%
                            </span>
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="text-start">
                        <button
                            onClick={() => openModal(row.original.id)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            View
                        </button>
                    </div>
                ),
            },
        ],
        []
    );

    // Table instance
    const table = useReactTable({
        data: participants,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
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
                setParticipants(participantsRes.value.data);
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
                    {/* Search */}
                    <div className="py-2 px-2 flex items-center justify-between gap-4 mb-6">
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
                        <div className="text-gray-400 text-sm font-medium">
                            {table.getFilteredRowModel().rows.length} participants
                        </div>
                    </div>
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
                                                {selectedParticipant.badges
                                                    .filter((b) => b.badge_type === "arcade_game")
                                                    .map((badge, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${badge.completed
                                                                ? "bg-green-950/30 border-green-700/50"
                                                                : "bg-gray-800/50 border-gray-700"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <span className="text-xl">{badge.completed ? "✅" : "⏳"}</span>
                                                                <span className={`text-base ${badge.completed ? "font-semibold" : "text-gray-400"}`}>
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
        </div>
    );
}
