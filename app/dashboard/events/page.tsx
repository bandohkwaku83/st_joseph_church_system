'use client';

import { useState } from 'react';

export default function EventsPage() {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const upcomingEvents = [
    {
      id: 1,
      title: 'Sunday Service',
      date: '2024-01-21',
      time: '09:00 AM',
      type: 'Service',
      attendees: 45,
      status: 'Scheduled',
    },
    {
      id: 2,
      title: 'Youth Meeting',
      date: '2024-01-19',
      time: '06:00 PM',
      type: 'Meeting',
      attendees: 120,
      status: 'Scheduled',
    },
    {
      id: 3,
      title: 'Prayer Night',
      date: '2024-01-17',
      time: '07:00 PM',
      type: 'Program',
      attendees: 80,
      status: 'Scheduled',
    },
    {
      id: 4,
      title: 'Men\'s Fellowship',
      date: '2024-01-20',
      time: '08:00 AM',
      type: 'Fellowship',
      attendees: 60,
      status: 'Scheduled',
    },
  ];

  const eventStats = [
    { label: 'This Month', value: '12', color: 'text-blue-600' },
    { label: 'This Week', value: '4', color: 'text-green-600' },
    { label: 'Upcoming', value: '7', color: 'text-purple-600' },
    { label: 'Volunteers', value: '45', color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Events & Programs</h1>
          <p className="text-gray-600 mt-1">Manage parish events, programs, and volunteer assignments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {viewMode === 'calendar' ? '📋 List View' : '📅 Calendar View'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
          >
            + Create Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {eventStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar/List View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">January 2024</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                ← Prev
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Today
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const hasEvent = [17, 19, 20, 21].includes(day);
              return (
                <div
                  key={day}
                  className={`min-h-[80px] p-2 border border-gray-200 rounded-lg ${
                    hasEvent ? 'bg-purple-50 border-purple-300' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{day}</div>
                  {hasEvent && (
                    <div className="mt-1 text-xs text-purple-700 font-medium">
                      {day === 17 && 'Prayer Night'}
                      {day === 19 && 'Youth Meeting'}
                      {day === 20 && "Men's Fellowship"}
                      {day === 21 && 'Sunday Service'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {event.type}
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {event.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                      <span>🕐 {event.time}</span>
                      <span>👥 {event.attendees} registered</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      View
                    </button>
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Volunteer Assignments</h2>
          <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Assign Volunteers
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { event: 'Sunday Service', volunteers: ['John Doe', 'Jane Smith', 'Mike Johnson'], needed: 5 },
            { event: 'Youth Meeting', volunteers: ['Sarah Williams', 'David Brown'], needed: 4 },
          ].map((assignment, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">{assignment.event}</h3>
              <div className="space-y-2">
                {assignment.volunteers.map((volunteer, vIndex) => (
                  <div key={vIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{volunteer}</span>
                    <button className="text-xs text-red-600 hover:text-red-700">Remove</button>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  {assignment.needed - assignment.volunteers.length} more volunteers needed
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sunday Service"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Service</option>
                  <option>Meeting</option>
                  <option>Program</option>
                  <option>Fellowship</option>
                  <option>Crusade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Main Sanctuary"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="reminder" className="rounded" />
                <label htmlFor="reminder" className="text-sm text-gray-700">
                  Send reminder notifications
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

