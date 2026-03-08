import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2,
    Plus,
    Trash2,
    ChevronLeft,
    Home,
    Trophy,
    Sparkles,
    LayoutGrid,
    Pencil
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Task = {
    id: string;
    text: string;
    completed: boolean;
};

type Room = {
    id: string;
    name: string;
    tasks: Task[];
    color: string;
};

// --- Sub-Component: Large Overall Progress ---
const MainProgressRing = ({ percentage }: { percentage: number }) => {
    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center py-4 progress-glow">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
            <svg
                width={size}
                height={size}
                style={{ transform: 'rotate(-90deg)' }}
                className="relative z-10"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#3b82f6"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    style={{
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 1s ease-in-out',
                        strokeLinecap: 'round'
                    }}
                />
            </svg>
            <div className="absolute flex flex-col items-center z-10">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">
                    {percentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Complete
                </span>
            </div>
        </div>
    );
};

export default function App() {
    const [rooms, setRooms] = useState<Room[]>(() => {
        const saved = localStorage.getItem('bseder-data');
        return saved
            ? JSON.parse(saved)
            : [
                { id: '1', name: 'Kitchen', tasks: [], color: 'bg-rose-500' },
                { id: '2', name: 'Living Room', tasks: [], color: 'bg-blue-500' }
            ];
    });

    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [isAddingRoom, setIsAddingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    useEffect(() => {
        localStorage.setItem('bseder-data', JSON.stringify(rooms));
    }, [rooms]);

    const stats = useMemo(() => {
        const total = rooms.reduce((acc, room) => acc + room.tasks.length, 0);
        const done = rooms.reduce(
            (acc, room) => acc + room.tasks.filter((task) => task.completed).length,
            0
        );

        return {
            total,
            done,
            percent: total === 0 ? 0 : Math.round((done / total) * 100)
        };
    }, [rooms]);

    const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null;

    const colors = [
        'bg-rose-500',
        'bg-amber-500',
        'bg-emerald-500',
        'bg-blue-500',
        'bg-violet-500',
        'bg-orange-500'
    ];

    const deleteRoom = (roomId: string) => {
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return;

        const hasTasks = room.tasks.length > 0;
        const message = hasTasks
            ? `Delete "${room.name}" and all its tasks?`
            : `Delete "${room.name}"?`;

        if (!window.confirm(message)) return;

        setRooms((prev) => prev.filter((r) => r.id !== roomId));

        if (activeRoomId === roomId) {
            setActiveRoomId(null);
        }
    };

    const renameRoom = (roomId: string) => {
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return;

        const newName = window.prompt('Edit room name:', room.name);
        if (!newName) return;

        const trimmed = newName.trim();
        if (!trimmed) return;

        setRooms((prev) =>
            prev.map((r) => (r.id === roomId ? { ...r, name: trimmed } : r))
        );
    };

    const renameTask = (taskId: string) => {
        if (!activeRoomId) return;

        const room = rooms.find((r) => r.id === activeRoomId);
        const task = room?.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newText = window.prompt('Edit task name:', task.text);
        if (!newText) return;

        const trimmed = newText.trim();
        if (!trimmed) return;

        setRooms((prev) =>
            prev.map((r) =>
                r.id === activeRoomId
                    ? {
                        ...r,
                        tasks: r.tasks.map((t) =>
                            t.id === taskId ? { ...t, text: trimmed } : t
                        )
                    }
                    : r
            )
        );
    };

    const deleteTask = (taskId: string) => {
        if (!activeRoomId) return;

        setRooms((prev) =>
            prev.map((room) =>
                room.id === activeRoomId
                    ? {
                        ...room,
                        tasks: room.tasks.filter((task) => task.id !== taskId)
                    }
                    : room
            )
        );
    };

    const toggleTask = (taskId: string) => {
        if (!activeRoomId) return;

        const currentRoom = rooms.find((room) => room.id === activeRoomId);
        const currentTask = currentRoom?.tasks.find((task) => task.id === taskId);

        setRooms((prev) =>
            prev.map((room) =>
                room.id === activeRoomId
                    ? {
                        ...room,
                        tasks: room.tasks.map((task) =>
                            task.id === taskId
                                ? { ...task, completed: !task.completed }
                                : task
                        )
                    }
                    : room
            )
        );

        if (currentTask && !currentTask.completed) {
            confetti({
                particleCount: 40,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#3b82f6', '#ffffff']
            });
        }
    };

    const addTask = (text: string) => {
        if (!activeRoomId) return;

        const trimmed = text.trim();
        if (!trimmed) return;

        setRooms((prev) =>
            prev.map((room) =>
                room.id === activeRoomId
                    ? {
                        ...room,
                        tasks: [
                            ...room.tasks,
                            {
                                id: Date.now().toString(),
                                text: trimmed,
                                completed: false
                            }
                        ]
                    }
                    : room
            )
        );
    };

    const addRoom = () => {
        const trimmed = newRoomName.trim();
        if (!trimmed) return;

        setRooms((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                name: trimmed,
                tasks: [],
                color: colors[prev.length % colors.length]
            }
        ]);

        setNewRoomName('');
        setIsAddingRoom(false);
    };

    return (
        <div className="min-h-screen max-w-md mx-auto overflow-x-hidden pb-12 font-sans border-x border-white/50 bg-white/40 backdrop-blur-sm shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-slate-100">
                {activeRoomId ? (
                    <button
                        onClick={() => setActiveRoomId(null)}
                        className="flex items-center gap-2 text-blue-600 font-bold group"
                    >
                        <ChevronLeft
                            size={24}
                            strokeWidth={3}
                            className="group-active:-translate-x-1 transition-transform"
                        />
                        <span className="text-lg">Dashboard</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                            <Sparkles size={20} className="text-white fill-white/20" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">
                            B&apos;SEDER
                        </h1>
                    </div>
                )}

                <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-200/50">
                    <Trophy
                        size={16}
                        className={
                            stats.percent === 100
                                ? 'text-yellow-500 animate-bounce'
                                : 'text-slate-400'
                        }
                    />
                    <span className="text-xs font-black text-slate-600 tracking-tighter">
                        {stats.percent}%
                    </span>
                </div>
            </nav>

            <main className="px-6 py-6">
                {!activeRoomId ? (
                    <div className="space-y-10 animate-in fade-in duration-700">
                        <section className="soft-card rounded-[3rem] overflow-hidden">
                            <MainProgressRing percentage={stats.percent} />
                            <div className="mt-4 text-center pb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    Total Progress
                                </p>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    {stats.done} of {stats.total} tasks completed
                                </p>
                            </div>
                        </section>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                    <LayoutGrid size={24} className="text-blue-600" />
                                    Rooms
                                </h2>

                                <button
                                    onClick={() => setIsAddingRoom(true)}
                                    className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center active:scale-90 transition-all hover:bg-blue-700"
                                >
                                    <Plus size={28} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {rooms.map((room, idx) => {
                                    const rTotal = room.tasks.length;
                                    const rDone = room.tasks.filter((t) => t.completed).length;
                                    const rPerc =
                                        rTotal === 0 ? 0 : Math.round((rDone / rTotal) * 100);
                                    const roomColor = room.color || colors[idx % colors.length];

                                    return (
                                        <div
                                            key={room.id}
                                            onClick={() => setActiveRoomId(room.id)}
                                            className={`group room-tile relative flex flex-col justify-between aspect-square p-6 rounded-[2.5rem] text-white ${roomColor}`}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteRoom(room.id);
                                                }}
                                                className="absolute top-4 right-4 p-2 bg-white/20 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    renameRoom(room.id);
                                                }}
                                                className="absolute top-4 right-16 p-2 bg-white/20 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <div>
                                                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
                                                    <Home size={22} className="fill-white/10" />
                                                </div>
                                                <h3 className="font-black text-lg leading-tight truncate">
                                                    {room.name}
                                                </h3>
                                                <p className="text-[10px] font-bold uppercase opacity-70 tracking-tighter mt-1">
                                                    {rTotal} Tasks
                                                </p>
                                            </div>

                                            <div className="mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {rPerc}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-white/30 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                        style={{ width: `${rPerc}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : activeRoom ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center gap-5 px-2">
                            <div
                                className={`w-16 h-16 ${
                                    activeRoom.color || 'bg-blue-600'
                                } text-white rounded-[2rem] flex items-center justify-center shadow-2xl`}
                            >
                                <Home size={32} />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
                                        {activeRoom.name}
                                    </h2>

                                    <button
                                        onClick={() => renameRoom(activeRoom.id)}
                                        className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button
                                        onClick={() => deleteRoom(activeRoom.id)}
                                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                                    Room Progress:{' '}
                                    {activeRoom.tasks.filter((t) => t.completed).length}/
                                    {activeRoom.tasks.length}
                                </p>
                            </div>
                        </div>

                        <div className="soft-card rounded-[3rem] overflow-hidden">
                            <div className="p-6 bg-slate-50/50 flex items-center gap-4 border-b border-slate-100">
                                <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600">
                                    <Plus size={20} strokeWidth={3} />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Add a new task..."
                                    className="bg-transparent outline-none w-full font-bold text-xl text-slate-700 placeholder:text-slate-300"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            addTask(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>

                            <div className="divide-y divide-slate-50">
                                {activeRoom.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`p-7 flex items-center justify-between group hover:bg-white/70 transition-all ${
                                            task.completed ? 'task-completed' : ''
                                        }`}
                                    >
                                        <div
                                            className="flex items-center gap-5 cursor-pointer flex-1"
                                            onClick={() => toggleTask(task.id)}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                                                    task.completed
                                                        ? 'bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-100'
                                                        : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                {task.completed && (
                                                    <CheckCircle2
                                                        className="text-white"
                                                        size={20}
                                                        fill="currentColor"
                                                    />
                                                )}
                                            </div>

                                            <span
                                                className={`text-xl transition-all duration-300 ${
                                                    task.completed
                                                        ? 'line-through text-slate-300 italic font-medium'
                                                        : 'font-bold text-slate-700'
                                                }`}
                                            >
                                                {task.text}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => renameTask(task.id)}
                                                className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                                            >
                                                <Pencil size={20} />
                                            </button>

                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            {isAddingRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="soft-card modal-pop w-full max-w-sm rounded-[4rem] p-12 relative">
                        <h3 className="text-3xl font-black text-slate-800 mb-2">
                            New Room
                        </h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">
                            Setup your zone
                        </p>

                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Dining Room"
                            className="w-full bg-slate-100 p-6 rounded-[2rem] mb-10 outline-none font-bold text-xl text-slate-700 focus:ring-4 ring-blue-500/10 transition-all"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addRoom();
                                }
                            }}
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAddingRoom(false)}
                                className="flex-1 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Back
                            </button>

                            <button
                                onClick={addRoom}
                                className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 active:scale-95 transition-all"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}