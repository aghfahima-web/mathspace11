import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  X,
  FileText,
  HelpCircle,
  Megaphone,
} from 'lucide-react';
import { User, CalendarEvent } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';

interface CalendarPageProps {
  currentUser: User;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-21');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [activeEventDetail, setActiveEventDetail] = useState<CalendarEvent | null>(null);

  // New event form
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-25');
  const [newTime, setNewTime] = useState('08:00');
  const [newType, setNewType] = useState<'ASSIGNMENT' | 'QUIZ' | 'ANNOUNCEMENT' | 'ACADEMIC'>('ACADEMIC');
  const [newDesc, setNewDesc] = useState('');

  const events = store.getCalendarEvents();
  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: CalendarEvent = {
      id: `cal-${Date.now()}`,
      title: newTitle,
      date: newDate,
      time: newTime,
      type: newType,
      description: newDesc,
      className: 'Semua Kelas',
    };
    store.saveCalendarEvent(event);
    setIsAddEventOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  // Mock days of October 2026
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Kalender Akademik & Jadwal Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Jadwal tenggat pengumpulan tugas, kuis aktif, dan agenda resmi sekolah.
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Agenda
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month View (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Oktober 2026
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                Semester Ganjil 2026/2027
              </span>
            </div>
          </div>

          {/* Days grid header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">
            <div>Min</div>
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div>Sab</div>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Offset 4 days for Thu Oct 1, 2026 */}
            <div className="h-20 sm:h-24 p-1.5 rounded-2xl bg-transparent" />
            <div className="h-20 sm:h-24 p-1.5 rounded-2xl bg-transparent" />
            <div className="h-20 sm:h-24 p-1.5 rounded-2xl bg-transparent" />
            <div className="h-20 sm:h-24 p-1.5 rounded-2xl bg-transparent" />

            {daysInMonth.map((day) => {
              const dateStr = `2026-10-${day.toString().padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isToday = day === 21;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
                      : isToday
                      ? 'border-indigo-400 bg-indigo-50/10'
                      : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Day Events Dots / Badges */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEventDetail(ev);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold truncate ${
                          ev.type === 'QUIZ'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : ev.type === 'ASSIGNMENT'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block text-center">
                        +{dayEvents.length - 2} lagi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events & Details (1 Col) */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Agenda Tanggal: {selectedDate}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Daftar kegiatan pembelajaran pada tanggal yang dipilih.
            </p>

            <div className="space-y-3">
              {(() => {
                const dayEvents = events.filter((e) => e.date === selectedDate);
                if (dayEvents.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic py-6 text-center">
                      Tidak ada jadwal khusus pada tanggal ini.
                    </p>
                  );
                }

                return dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setActiveEventDetail(ev)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-indigo-300 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Badge
                        variant={
                          ev.type === 'QUIZ'
                            ? 'danger'
                            : ev.type === 'ASSIGNMENT'
                            ? 'primary'
                            : 'success'
                        }
                        size="sm"
                      >
                        {ev.type}
                      </Badge>
                      {ev.time && (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.time} WIB
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {ev.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {ev.description}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {activeEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Badge variant="primary">{activeEventDetail.type}</Badge>
              <button
                onClick={() => setActiveEventDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {activeEventDetail.title}
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeEventDetail.date}
                </span>
              </div>
              {activeEventDetail.time && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeEventDetail.time} WIB
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {activeEventDetail.description}
            </p>

            <button
              onClick={() => setActiveEventDetail(null)}
              className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tambah Agenda Baru
              </h3>
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Agenda
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Remedial PTS Fisika"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu (WIB)
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Agenda
                </label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="ACADEMIC">Kegiatan Akademik</option>
                  <option value="QUIZ">Quiz / Ujian</option>
                  <option value="ASSIGNMENT">Tenggat Tugas</option>
                  <option value="ANNOUNCEMENT">Pengumuman</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Singkat
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Informasi detail kegiatan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
