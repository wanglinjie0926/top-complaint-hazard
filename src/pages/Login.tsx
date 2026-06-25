import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Building2, MapPin, Lock, Eye } from 'lucide-react';

const cities = ['绵阳', '德阳', '泸州', '雅安', '南充'];

export default function Login() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CITY_ADMIN);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const counties: Record<string, string[]> = {
    '绵阳': ['涪城区', '游仙区', '江油市', '绵竹市', '安州区'],
    '德阳': ['旌阳区', '罗江区', '广汉市', '什邡市', '中江县'],
    '泸州': ['江阳区', '纳溪区', '龙马潭区', '泸县', '合江县'],
    '雅安': ['雨城区', '名山区', '荥经县', '汉源县', '石棉县'],
    '南充': ['顺庆区', '高坪区', '嘉陵区', '阆中市', '南部县']
  };

  const handleLogin = () => {
    if (!selectedCity) return;
    if (role === UserRole.COUNTY_ADMIN && !selectedCounty) return;
    if (!password.trim()) return;
    login(role, selectedCity, role === UserRole.COUNTY_ADMIN ? selectedCounty || undefined : undefined);
    navigate('/orders');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">TOP投诉小区隐患整治系统</h1>
          <p className="text-gray-500 mt-2">工单管理平台</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 角色切换 */}
          <div className="flex mb-6 border-b border-gray-200">
            <button
              onClick={() => setRole(UserRole.CITY_ADMIN)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                role === UserRole.CITY_ADMIN
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              地市管理员
            </button>
            <button
              onClick={() => setRole(UserRole.COUNTY_ADMIN)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                role === UserRole.COUNTY_ADMIN
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              区县管理员
            </button>
          </div>

          {/* 表单 */}
          <div className="space-y-4">
            {/* 地市选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 size={14} className="inline mr-1" />
                所属地市
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedCounty('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择地市</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* 区县选择 */}
            {role === UserRole.COUNTY_ADMIN && selectedCity && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  所属区县
                </label>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择区县</option>
                  {counties[selectedCity]?.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 账号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
              <input
                type="text"
                defaultValue={role === UserRole.CITY_ADMIN ? 'city_admin' : 'county_admin'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>

            {/* 密码 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock size={14} className="inline mr-1" />
                密码
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                <Eye size={16} />
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={!selectedCity || !password.trim() || (role === UserRole.COUNTY_ADMIN && !selectedCounty)}
              className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              登 录
            </button>
          </div>
        </div>

        {/* 底部版权 */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Copyright © 2026 TOP投诉小区隐患整治系统 All Rights Reserved
        </p>
      </div>
    </div>
  );
}
