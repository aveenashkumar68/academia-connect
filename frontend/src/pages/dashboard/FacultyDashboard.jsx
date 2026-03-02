import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  GraduationCap, Users, TrendingUp, Building2, Globe,
  ArrowRight, RefreshCw, BookOpen, Lightbulb, MousePointer
} from "lucide-react";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to fetch departments");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/chat/users");
      setAllUsers(data);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  // Derived data
  const students = useMemo(() => allUsers.filter(u => u.role === "student"), [allUsers]);
  const facultyMembers = useMemo(() => allUsers.filter(u => u.role === "admin"), [allUsers]);

  // Students per department
  const deptData = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const dept = s.department || "Unknown";
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [students]);

  const maxDeptCount = useMemo(() => {
    const m = Math.max(...deptData.map(d => d.count), 1);
    return Math.ceil(m / 50) * 50; // round up to nearest 50
  }, [deptData]);

  // X-axis labels for bar chart
  const xAxisLabels = useMemo(() => {
    const step = Math.max(Math.ceil(maxDeptCount / 5), 1);
    return [0, step, step * 2, step * 3, step * 4, step * 5];
  }, [maxDeptCount]);

  // Domain distribution
  const domainData = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const domain = s.domain || "Unassigned";
      map[domain] = (map[domain] || 0) + 1;
    });
    const total = students.length || 1;
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [students]);

  const DOMAIN_COLORS = ["#3f6bc2", "#6d94dd", "#a5c1f2", "#c9dafc", "#3865b0", "#8baae0"];

  // Donut conic gradient
  const donutGradient = useMemo(() => {
    if (domainData.length === 0) return "conic-gradient(#e3e9f2 0% 100%)";
    let acc = 0;
    const stops = domainData.map((d, i) => {
      const start = acc;
      acc += d.percent;
      return `${DOMAIN_COLORS[i % DOMAIN_COLORS.length]} ${start}% ${acc}%`;
    });
    if (acc < 100) stops.push(`#e3e9f2 ${acc}% 100%`);
    return `conic-gradient(${stops.join(", ")})`;
  }, [domainData]);

  // Active percent (non-unassigned)
  const activePercent = useMemo(() => {
    const assigned = students.filter(s => s.domain && s.domain !== "Unassigned").length;
    return students.length > 0 ? Math.round((assigned / students.length) * 100) : 0;
  }, [students]);

  // STEM insight
  const stemPercent = useMemo(() => {
    const stemKeywords = ["computer", "data", "ai", "machine", "electronic", "iot", "engineering", "science", "tech", "software", "cyber", "cloud", "robot"];
    const stemCount = domainData
      .filter(d => stemKeywords.some(k => d.name.toLowerCase().includes(k)))
      .reduce((sum, d) => sum + d.count, 0);
    return students.length > 0 ? Math.round((stemCount / students.length) * 100) : 0;
  }, [domainData, students]);

  return (
    <DashboardLayout title="Faculty Dashboard" description="View analytics and insights">

      {/* ═══ Header ═══ */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16212e]">Faculty Dashboard</h2>
        <p className="text-sm text-[#546f8b] mt-1">View analytics and manage your students</p>
      </div>

      {/* ═══ Clickable Metric Cards ═══ */}
      <div className="flex flex-wrap gap-3 sm:gap-[18px] mb-7 sm:mb-9">

        {/* Total Students → navigate to students page */}
        <div
          onClick={() => navigate("/dashboard/faculty/students")}
          role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/dashboard/faculty/students")}
          className="flex-1 min-w-[140px] sm:min-w-[150px] bg-white rounded-2xl sm:rounded-[28px] p-4 sm:p-[24px_22px] flex items-center gap-3 sm:gap-[18px] shadow-[0_10px_22px_rgba(0,20,40,0.04)] border border-[#e1e9f2] cursor-pointer hover:shadow-[0_12px_28px_rgba(28,60,120,0.08)] active:scale-[0.99] transition-all"
        >
          <div className="w-12 h-12 sm:w-[58px] sm:h-[58px] bg-[#e8f0fe] rounded-[16px] sm:rounded-[20px] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-[#2b4a81]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[28px] sm:text-[34px] font-bold text-[#16212e] leading-tight tracking-tight">{students.length.toLocaleString()}</h3>
            <p className="text-[14px] sm:text-[16px] font-medium text-[#546f8b] mt-1 flex items-center gap-1.5">
              Total students <ArrowRight className="w-3 h-3 opacity-70" />
            </p>
          </div>
        </div>

        {/* Total Faculty → navigate to community */}
        <div
          onClick={() => navigate("/community")}
          role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/community")}
          className="flex-1 min-w-[140px] sm:min-w-[150px] bg-white rounded-2xl sm:rounded-[28px] p-4 sm:p-[24px_22px] flex items-center gap-3 sm:gap-[18px] shadow-[0_10px_22px_rgba(0,20,40,0.04)] border border-[#e1e9f2] cursor-pointer hover:shadow-[0_12px_28px_rgba(28,60,120,0.08)] active:scale-[0.99] transition-all"
        >
          <div className="w-12 h-12 sm:w-[58px] sm:h-[58px] bg-[#e8f0fe] rounded-[16px] sm:rounded-[20px] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#2b4a81]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[28px] sm:text-[34px] font-bold text-[#16212e] leading-tight tracking-tight">{facultyMembers.length}</h3>
            <p className="text-[14px] sm:text-[16px] font-medium text-[#546f8b] mt-1 flex items-center gap-1.5">
              Total faculty <ArrowRight className="w-3 h-3 opacity-70" />
            </p>
          </div>
        </div>

        {/* Departments → navigate to chat */}
        <div
          onClick={() => navigate("/chat")}
          role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/chat")}
          className="flex-1 min-w-[140px] sm:min-w-[150px] bg-white rounded-2xl sm:rounded-[28px] p-4 sm:p-[24px_22px] flex items-center gap-3 sm:gap-[18px] shadow-[0_10px_22px_rgba(0,20,40,0.04)] border border-[#e1e9f2] cursor-pointer hover:shadow-[0_12px_28px_rgba(28,60,120,0.08)] active:scale-[0.99] transition-all"
        >
          <div className="w-12 h-12 sm:w-[58px] sm:h-[58px] bg-[#e8f0fe] rounded-[16px] sm:rounded-[20px] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-[#2b4a81]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[28px] sm:text-[34px] font-bold text-[#16212e] leading-tight tracking-tight">{departments.length}</h3>
            <p className="text-[14px] sm:text-[16px] font-medium text-[#546f8b] mt-1 flex items-center gap-1.5">
              Activities <ArrowRight className="w-3 h-3 opacity-70" />
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Analytics Title ═══ */}
      <div className="mb-4 sm:mb-5">
        <h2 className="text-lg sm:text-[24px] font-semibold text-[#1d2f48] border-l-[6px] border-[#3160af] pl-4">
          Analytics & Insights
        </h2>
      </div>

      {/* ═══ Charts Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7">

        {/* ── Students by Department (Bar Chart with Axis) ── */}
        <div className="bg-white rounded-2xl sm:rounded-[34px] p-5 sm:p-[26px] shadow-[0_18px_30px_rgba(0,0,0,0.02)] border border-[#e2eaf5]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="bg-[#ecf3fd] p-3 rounded-[18px]">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#264e8a]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#1a314f]">Students by department</h3>
          </div>

          {/* Bar Chart */}
          <div className="space-y-3 sm:space-y-4">
            {deptData.length > 0 ? deptData.map((d) => (
              <div key={d.name}>
                {/* Desktop: single row */}
                <div className="hidden sm:flex items-center gap-3 h-10">
                  <span className="w-[130px] text-[15px] font-medium text-[#253c5c] flex items-center gap-1.5 truncate shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-[#3361ad] shrink-0" />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <div className="flex-1 flex items-center gap-3">
                    <div
                      className="h-7 rounded-full min-w-[6px] transition-all duration-500 ease-out"
                      style={{
                        width: `${(d.count / maxDeptCount) * 100}%`,
                        background: "linear-gradient(90deg, #2d56a5, #5f83c7)",
                        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3)"
                      }}
                    />
                    <span className="text-base font-semibold text-[#20406b] min-w-[48px]">{d.count}</span>
                  </div>
                </div>

                {/* Mobile: stacked layout */}
                <div className="sm:hidden space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#253c5c] flex items-center gap-1.5 truncate">
                      <Building2 className="w-3 h-3 text-[#3361ad] shrink-0" />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="text-[15px] font-semibold text-[#20406b] shrink-0">{d.count}</span>
                  </div>
                  <div className="w-full h-5 bg-[#e8eef6] rounded-full overflow-hidden">
                    <div
                      className="h-5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(d.count / maxDeptCount) * 100}%`,
                        background: "linear-gradient(90deg, #2d56a5, #5f83c7)"
                      }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-sm text-[#6b7c9e]">No department data available</div>
            )}
          </div>

          {/* X-axis scale (desktop only) */}
          {deptData.length > 0 && (
            <div className="hidden sm:flex mt-4 pt-3 border-t border-dashed border-[#cbd6e6] text-[13px] text-[#5c789b]" style={{ marginLeft: "142px" }}>
              {xAxisLabels.map((v, i) => (
                <span key={i} className="flex-1 text-center">{v}</span>
              ))}
            </div>
          )}

          {/* Summary pill */}
          <div className="mt-4 sm:mt-[18px] bg-[#f6fafe] rounded-full py-2.5 px-4 inline-flex items-center gap-2 text-[14px] text-[#28487a]">
            <Users className="w-3.5 h-3.5 shrink-0" /> total <strong>{students.length.toLocaleString()}</strong> students
          </div>
        </div>

        {/* ── Domain Distribution ── */}
        <div className="bg-white rounded-2xl sm:rounded-[34px] p-5 sm:p-[26px] shadow-[0_18px_30px_rgba(0,0,0,0.02)] border border-[#e2eaf5]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="bg-[#ecf3fd] p-3 rounded-[18px]">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#264e8a]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#1a314f]">Domain distribution</h3>
          </div>

          {/* Donut + Legend Row */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start gap-5 sm:gap-6">
            {/* Donut */}
            <div
              className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-full flex items-center justify-center shrink-0"
              style={{
                background: donutGradient,
                boxShadow: "0 10px 20px rgba(45, 80, 140, 0.1)"
              }}
            >
              <div className="bg-white w-[96px] h-[96px] sm:w-[110px] sm:h-[110px] rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                <strong className="text-2xl sm:text-[28px] font-bold text-[#153368]">{activePercent}%</strong>
                <span className="text-[11px] sm:text-[12px] text-[#4f698c]">active</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex-1 min-w-[180px] flex flex-col gap-3 sm:gap-[14px] w-full sm:w-auto">
              {domainData.length > 0 ? domainData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] rounded-lg shrink-0" style={{ background: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }} />
                  <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
                    <span className="text-[14px] sm:text-[16px] font-medium text-[#1e3657] truncate">{d.name}</span>
                    <span className="text-[13px] sm:text-[14px] font-semibold text-[#1f3f73] bg-[#eaf1fd] px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shrink-0">{d.count}</span>
                  </div>
                  <span className="text-[14px] sm:text-[15px] font-medium text-[#557bc2] min-w-[40px] text-right shrink-0">{d.percent}%</span>
                </div>
              )) : (
                <div className="text-center py-6 text-sm text-[#6b7c9e]">No domain data available</div>
              )}
            </div>
          </div>

          {/* Insight footer */}
          {stemPercent > 0 && (
            <div className="mt-5 sm:mt-6 bg-[#f0f6ff] rounded-full py-3 px-4 sm:px-5 text-[14px] sm:text-[15px] text-[#1f3f6b] border border-[#d9e6fd] flex items-center gap-2.5">
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>{stemPercent}% of interests in STEM fields</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Footer Note ═══ */}
      <div className="mt-8 sm:mt-10 pt-4 sm:pt-[18px] border-t border-dashed border-[#d2deed] text-[12px] sm:text-[13px] text-[#6e8bb0] flex items-center gap-1.5">
        <MousePointer className="w-3 h-3 opacity-60" /> All top cards clickable · responsive dashboard
      </div>
    </DashboardLayout>
  );
}