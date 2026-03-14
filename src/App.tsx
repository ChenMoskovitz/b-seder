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
    Pencil,
    GripVertical
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
            <div className="absolute flex flex-col items-center z-10 text-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">
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
        if (!saved) return [];

        const parsed = JSON.parse(saved);

        // Define the gradients here to upgrade old data safely
        const upgradeGradients = [
            'from-rose-500 to-pink-600',
            'from-blue-600 to-indigo-700',
            'from-emerald-500 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-violet-600 to-purple-700',
            'from-cyan-500 to-blue-500'
        ];

        // Check if the saved color is a new gradient. If not, assign a new one!
        return parsed.map((room: any, index: number) => ({
            ...room,
            color: room.color?.includes('from-')
                ? room.color
                : upgradeGradients[index % upgradeGradients.length]
        }));
    });

    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [isAddingRoom, setIsAddingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [draggedRoomId, setDraggedRoomId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('bseder-data', JSON.stringify(rooms));
    }, [rooms]);

    const stats = useMemo(() => {
        const total = rooms.reduce((acc, room) => acc + room.tasks.length, 0);
        const done = rooms.reduce(
            (acc, room) => acc + room.tasks.filter((task) => task.completed).length,
            0
        );
        const percent = total === 0 ? 0 : parseFloat(((done / total) * 100).toFixed(2));
        return { total, done, percent };
    }, [rooms]);

    const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null;

    const gradients = [
        'from-rose-500 to-pink-600',
        'from-blue-600 to-indigo-700',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-violet-600 to-purple-700',
        'from-cyan-500 to-blue-500'
    ];

    const deleteRoom = (roomId: string) => {
        if (!window.confirm("Delete this room?")) return;
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        if (activeRoomId === roomId) setActiveRoomId(null);
    };

    const renameRoom = (roomId: string) => {
        const room = rooms.find((r) => r.id === roomId);
        const newName = window.prompt('Edit room name:', room?.name);
        if (newName?.trim()) {
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: newName.trim() } : r));
        }
    };

    const toggleTask = (taskId: string) => {
        if (!activeRoomId) return;
        const currentRoom = rooms.find(r => r.id === activeRoomId);
        const task = currentRoom?.tasks.find(t => t.id === taskId);

        setRooms(prev => prev.map(r => r.id === activeRoomId ? {
            ...r, tasks: r.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        } : r));

        if (task && !task.completed) {
            confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 }, colors: ['#3b82f6', '#ffffff'] });
        }
    };

    const addTask = (text: string) => {
        if (!activeRoomId || !text.trim()) return;
        setRooms(prev => prev.map(r => r.id === activeRoomId ? {
            ...r, tasks: [...r.tasks, { id: Date.now().toString(), text: text.trim(), completed: false }]
        } : r));
    };

    const addRoom = () => {
        if (!newRoomName.trim()) return;
        setRooms(prev => [...prev, {
            id: Date.now().toString(),
            name: newRoomName.trim(),
            tasks: [],
            color: gradients[prev.length % gradients.length]
        }]);
        setNewRoomName('');
        setIsAddingRoom(false);
    };

    const moveTask = (draggedId: string, targetId: string) => {
        setRooms(prev => prev.map(r => {
            if (r.id !== activeRoomId) return r;
            const tasks = [...r.tasks];
            const from = tasks.findIndex(t => t.id === draggedId);
            const to = tasks.findIndex(t => t.id === targetId);
            const [moved] = tasks.splice(from, 1);
            tasks.splice(to, 0, moved);
            return { ...r, tasks };
        }));
    };

    const moveRoom = (draggedId: string, targetId: string) => {
        const from = rooms.findIndex(r => r.id === draggedId);
        const to = rooms.findIndex(r => r.id === targetId);
        const newRooms = [...rooms];
        const [moved] = newRooms.splice(from, 1);
        newRooms.splice(to, 0, moved);
        setRooms(newRooms);
    };

    return (
        <div className="min-h-screen max-w-md mx-auto bg-slate-50 border-x border-slate-200 shadow-2xl">
            <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
                {activeRoomId ? (
                    <button onClick={() => setActiveRoomId(null)} className="flex items-center gap-2 text-blue-600 font-bold">
                        <ChevronLeft size={24} strokeWidth={3} />
                        <span>Dashboard</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                            <Sparkles size={20} className="text-white fill-white/20" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 italic">B&apos;SEDER</h1>
                    </div>
                )}
                <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-200/50">
                    <Trophy size={16} className={stats.percent === 100 ? 'text-yellow-500 animate-bounce' : 'text-slate-400'} />
                    <span className="text-xs font-black text-slate-600">{stats.percent}%</span>
                </div>
            </nav>

            <main className="px-6 py-6">
                {!activeRoomId ? (
                    <div className="space-y-10">
                        <section className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-4">
                            <MainProgressRing percentage={stats.percent} />
                            <div className="text-center pb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Progress</p>
                                <p className="text-sm text-slate-500 font-medium mt-1">{stats.done} of {stats.total} tasks done</p>
                            </div>
                        </section>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <LayoutGrid size={24} className="text-blue-600" />
                                    Rooms
                                </h2>
                                <button onClick={() => setIsAddingRoom(true)} className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all">
                                    <Plus size={28} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {rooms.map((room) => {
                                    const rTotal = room.tasks.length;
                                    const rDone = room.tasks.filter(t => t.completed).length;
                                    const rPerc = rTotal === 0 ? 0 : parseFloat(((rDone / rTotal) * 100).toFixed(2));

                                    return (
                                        <div
                                            key={room.id}
                                            draggable
                                            onDragStart={() => setDraggedRoomId(room.id)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => draggedRoomId && moveRoom(draggedRoomId, room.id)}
                                            onClick={() => setActiveRoomId(room.id)}
                                            className={`group relative flex flex-col justify-between aspect-square p-5 rounded-[2.5rem] text-white bg-linear-to-br shadow-lg active:scale-95 transition-all cursor-grab ${room.color || 'from-blue-500 to-indigo-600'}`}
                                        >
                                            <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }} className="p-2 bg-white/20 rounded-lg backdrop-blur-md"><Trash2 size={14} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); renameRoom(room.id); }} className="p-2 bg-white/20 rounded-lg backdrop-blur-md"><Pencil size={14} /></button>
                                            </div>
                                            <div>
                                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-2"><Home size={18} /></div>
                                                <h3 className="font-bold text-base leading-tight truncate">{room.name}</h3>
                                                <p className="text-[10px] uppercase opacity-80">{rTotal} Tasks</p>
                                            </div>
                                            <div className="mt-2">
                                                <span className="text-[10px] font-black">{rPerc}%</span>
                                                <div className="h-1.5 w-full bg-white/30 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${rPerc}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : activeRoom ? (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${activeRoom.color} text-white flex items-center justify-center shadow-lg`}>
                                <Home size={28} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-slate-800 leading-none">{activeRoom.name}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                    {activeRoom.tasks.filter(t => t.completed).length}/{activeRoom.tasks.length} Tasks Done
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 bg-slate-50 flex items-center gap-4 border-b">
                                <Plus size={20} className="text-blue-600" />
                                <input
                                    type="text" placeholder="Add task..." className="bg-transparent outline-none w-full font-bold text-lg text-slate-700"
                                    onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addTask(e.currentTarget.value); e.currentTarget.value = ''; } }}
                                />
                            </div>
                            <div className="divide-y divide-slate-50">
                                {activeRoom.tasks.map((task) => (
                                    <div
                                        key={task.id} draggable onDragStart={() => setDraggedTaskId(task.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => draggedTaskId && moveTask(draggedTaskId, task.id)}
                                        className={`p-5 flex items-center justify-between group transition-all ${task.completed ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleTask(task.id)}>
                                            <GripVertical size={16} className="text-slate-300" />
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-200'}`}>
                                                {task.completed && <CheckCircle2 size={16} className="text-white" />}
                                            </div>
                                            <span className={`text-lg ${task.completed ? 'line-through text-slate-400 italic' : 'font-bold text-slate-700'}`}>{task.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            {isAddingRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">New Room</h3>
                        <input
                            autoFocus type="text" placeholder="Room name..." value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') addRoom(); }}
                            className="w-full bg-slate-100 p-5 rounded-2xl mb-8 outline-none font-bold text-lg"
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setIsAddingRoom(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                            <button onClick={addRoom} className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}