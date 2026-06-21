"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
  Users, MapPin, CheckCircle, Clock, Bell, Download,
  ChevronRight, BookOpen, GraduationCap, ShieldCheck,
  ArrowUpRight, Landmark, Activity, Map, Search, FileText,
  Phone, Mail, Globe, MonitorPlay, BarChart3, Trophy, Headset, Star
} from "lucide-react";
import CircularsWidget from "@/components/announcements/CircularsWidget";

const districtData = [
  { name: 'Srikakulam', attendance: 92, target: 100 },
  { name: 'Vizianagaram', attendance: 88, target: 100 },
  { name: 'Visakhapatnam', attendance: 95, target: 100 },
  { name: 'East Godavari', attendance: 91, target: 100 },
  { name: 'West Godavari', attendance: 94, target: 100 },
  { name: 'Krishna', attendance: 97, target: 100 },
  { name: 'Guntur', attendance: 93, target: 100 },
];

const timelineData = [
  { day: 'Day 1', completed: 15 },
  { day: 'Day 2', completed: 35 },
  { day: 'Day 3', completed: 65 },
  { day: 'Day 4', completed: 85 },
  { day: 'Day 5', completed: 98 },
];

const resourceData = [
  { type: "PDF", title: "Year-3 Curriculum Guidelines", size: "2.4 MB", date: "Oct 10, 2024" },
  { type: "PDF", title: "Biometric Integration Manual for MEOs", size: "1.1 MB", date: "Oct 08, 2024" },
  { type: "VIDEO", title: "Keynote: Digital Pedagogy Best Practices", size: "45 mins", date: "Oct 15, 2024" },
  { type: "EXCEL", title: "Master Venue List (13 Districts)", size: "450 KB", date: "Oct 12, 2024" },
];

export default function PortalHomepage({ dashboardUrl, isAuth }: { dashboardUrl: string, isAuth: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-800 selection:bg-[#00418C] selection:text-white">

      {/* Official Government Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="bg-[#00418C] h-1.5 w-full"></div>
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-14 bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-1 rounded-sm shadow-sm">
              <Image src="/favicon.svg" alt="Govt Logo" width={32} height={32} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#00418C] tracking-tight uppercase">Gnana Prakash</h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Department of School Education, Govt of AP</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {["Dashboard", "Analytics", "Modules", "Resources", "Circulars"].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold text-slate-600 hover:text-[#00418C] transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isAuth ? (
              <Link href={dashboardUrl} className="flex items-center gap-2 bg-[#00418C] text-white px-5 py-2.5 rounded text-sm font-bold shadow-md hover:bg-[#003370] transition-colors">
                Portal Access <ArrowUpRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/register" className="hidden sm:block text-sm font-semibold text-[#00418C] hover:underline">New Registration</Link>
                <Link href="/login" className="flex items-center gap-2 bg-[#D32F2F] text-white px-6 py-2.5 rounded text-sm font-bold shadow-md hover:bg-[#B71C1C] transition-colors">
                  Login <ShieldCheck className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Hero Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-full opacity-10 pointer-events-none">
            <Image src="/features_bg.png" alt="Abstract Background" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Year-3 Training Phase
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
                Certificate Course Training <br className="hidden md:block" /> for Secondary Grade Teachers
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl font-medium">
                Real-time monitoring and management portal for DEO, SS officials, MEOs, HMs, and CRPs across Andhra Pradesh.
              </p>
              <div className="flex gap-4">
                <button className="bg-[#00418C] text-white px-6 py-3 rounded font-bold shadow-md shadow-blue-900/20 hover:bg-[#003370] transition-colors flex items-center gap-2">
                  <Download className="w-5 h-5" /> Download Guidelines
                </button>
                <button className="bg-slate-100 text-slate-700 border border-slate-200 px-6 py-3 rounded font-bold hover:bg-slate-200 transition-colors">
                  View Daily Schedule
                </button>
              </div>
            </div>

            {/* Live Impact Card embedded in Hero */}
            <div className="w-full md:w-80 bg-[#00418C] text-white p-6 rounded-xl shadow-xl shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-20"><Activity className="w-32 h-32 -mt-8 -mr-8" /></div>
              <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Today's Statewide Attendance</h3>
              <p className="text-5xl font-black mb-2">94.8%</p>
              <p className="text-sm text-blue-100 mb-6 flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-emerald-400" /> +2.4% from yesterday</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>Present SGTs</span> <span className="font-bold">1,12,450</span></div>
                <div className="w-full bg-blue-900/50 rounded-full h-1.5"><div className="bg-emerald-400 h-1.5 rounded-full w-[94.8%]"></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* Global KPI Cards */}
        <section id="dashboard" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Registered SGTs", value: "1,18,500", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Active Training Venues", value: "450+", icon: MapPin, color: "text-rose-600", bg: "bg-rose-50" },
            { title: "Modules Completed", value: "4 / 6", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Certificates Issued", value: "45,210", icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((kpi, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#00418C]/30 transition-colors">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{kpi.title}</p>
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              </div>
              <div className={`w-14 h-14 ${kpi.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
              </div>
            </motion.div>
          ))}
        </section>

        <div id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Analytics Area */}
          <div className="lg:col-span-2 space-y-8">

            {/* District Wise Participation Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">District-wise Participation Overview</h3>
                  <p className="text-sm text-slate-500">Real-time attendance tracking across major AP districts</p>
                </div>
                <button className="text-sm font-bold text-[#00418C] hover:underline flex items-center gap-1">View Full Report <ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="h-[300px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="attendance" fill="#00418C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Comprehensive Curriculum & Modules */}
            <div id="modules" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Year-3 Certificate Curriculum Status</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded">Cohort 2024-25</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Module 1: Foundational Literacy & Numeracy", status: "Completed", date: "Oct 12 - Oct 15", progress: 100 },
                  { name: "Module 2: Digital Pedagogy Integration", status: "Completed", date: "Oct 16 - Oct 19", progress: 100 },
                  { name: "Module 3: Inclusive Classroom Practices", status: "In Progress", date: "Oct 20 - Oct 23", progress: 65 },
                  { name: "Module 4: Continuous Comprehensive Evaluation", status: "Upcoming", date: "Oct 24 - Oct 27", progress: 0 },
                ].map((mod, idx) => (
                  <div key={idx} className="border border-slate-100 bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-sm w-3/4">{mod.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${mod.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : mod.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                        {mod.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.date}</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-[#00418C] h-1.5 rounded-full" style={{ width: `${mod.progress}%` }}></div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Repository & Resources */}
            <div id="resources" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Official Resource Directory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resourceData.map((res, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 border border-slate-100 hover:border-slate-300 transition-colors rounded-lg group cursor-pointer">
                    <div className={`p-2 rounded ${res.type === 'PDF' ? 'bg-red-50 text-red-600' : res.type === 'VIDEO' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                      {res.type === 'PDF' && <FileText className="w-6 h-6" />}
                      {res.type === 'VIDEO' && <MonitorPlay className="w-6 h-6" />}
                      {res.type === 'EXCEL' && <BarChart3 className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#00418C] transition-colors line-clamp-1">{res.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{res.size}</span>
                        <span>•</span>
                        <span>{res.date}</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-300 group-hover:text-[#00418C] opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">

            {/* Timeline Area Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Training Progress Timeline</h3>
              <p className="text-xs text-slate-500 mb-6">Cumulative state-wide module completion rate</p>
              <div className="h-[200px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Geographical Map Mockup */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">State Distribution</h3>
                <Map className="w-5 h-5 text-slate-400" />
              </div>
              <div className="w-full aspect-video bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-100 text-[#00418C] rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">13 Core Districts Active</p>
                  <p className="text-xs text-slate-500 mt-1">Full state coverage achieved for Phase 1 of the SGT Training Program.</p>
                </div>
              </div>
            </div>

            {/* Notifications & Updates */}
            <div id="circulars" className="h-[400px]">
              <CircularsWidget />
            </div>

          </div>
        </div>

        {/* Extended Data Section: Venues & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

          {/* Top Performing Venues */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Top Performing Venues</h3>
                <p className="text-sm text-slate-500">Based on attendance & module completion</p>
              </div>
              <button className="text-sm font-bold text-[#00418C] hover:underline flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {[
                { name: "ZPHS Boys, Vizianagaram", admin: "KRP: Srinivas R.", score: "99.8%", trend: "up" },
                { name: "Govt High School, Krishna", admin: "KRP: Lakshmi P.", score: "99.5%", trend: "up" },
                { name: "AP Model School, Guntur", admin: "KRP: Venkat S.", score: "98.9%", trend: "flat" },
                { name: "Municipal HS, Srikakulam", admin: "KRP: Ramesh K.", score: "98.2%", trend: "up" },
              ].map((venue, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{venue.name}</p>
                      <p className="text-xs text-slate-500">{venue.admin}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{venue.score}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Completion</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Helpdesk & Support SLA */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Headset className="w-5 h-5 text-[#00418C]" /> Live Support Desk</h3>
                <p className="text-sm text-slate-500">State technical helpdesk resolution metrics</p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">SLA: Green</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <p className="text-3xl font-black text-[#00418C]">412</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Tickets Resolved</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <p className="text-3xl font-black text-amber-600">14</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Pending Sync</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Common Resolution Tags Today</h4>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-full text-slate-600">Biometric Timeout (45%)</span>
                <span className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-full text-slate-600">Password Reset (30%)</span>
                <span className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-full text-slate-600">Module Access (15%)</span>
                <span className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-full text-slate-600">Other (10%)</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Official Government Footer */}
      <footer className="bg-[#1e293b] text-slate-300 mt-16 pt-16 pb-8 border-t-4 border-[#00418C]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

            {/* Branding Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Image src="/favicon.svg" alt="Govt Logo" width={40} height={40} className="brightness-0 invert" />
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Gnana Prakash</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training Management System</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
                The official portal for monitoring and managing the Year-3 Certificate Course Training for Secondary Grade Teachers (SGTs) across the State of Andhra Pradesh.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-[#00418C] hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-[#00418C] hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-[#00418C] hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Portal Login</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Register for Training</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Download Guidelines</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">View Master Schedule</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ & Support</Link></li>
              </ul>
            </div>

            {/* Affiliations */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Govt Portals</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">AP State Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ministry of Education</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SCERT Andhra Pradesh</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Samagra Shiksha AP</a></li>
                <li><a href="#" className="hover:text-white transition-colors">National Informatics Centre</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 shrink-0 text-[#00418C]" />
                  <span>Directorate of School Education,<br />Anjaneya Towers, Ibrahimpatnam,<br />Vijayawada, AP 521456</span>
                </li>
                <li className="flex gap-3 items-center">
                  <Phone className="w-5 h-5 shrink-0 text-[#00418C]" />
                  <span>1800-425-4567 (Toll Free)</span>
                </li>
                <li className="flex gap-3 items-center">
                  <Mail className="w-5 h-5 shrink-0 text-[#00418C]" />
                  <span>support.gnanaprakash@ap.gov.in</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-medium text-center md:text-left">
              © {new Date().getFullYear()} Department of School Education, Government of Andhra Pradesh. All rights reserved.<br />
              Platform designed and maintained by NIC / AP State Technical Team.
            </p>
            <div className="flex gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Use</Link>
              <Link href="#" className="hover:text-white transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
