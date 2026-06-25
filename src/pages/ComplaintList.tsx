import { useEffect, useState, useMemo } from 'react';
import { useOrderStore } from '@/stores/orderStore';
import { Download } from 'lucide-react';

const cities = ['绵阳', '德阳', '泸州', '雅安', '南充'];
const countiesByCity: Record<string, string[]> = {
  绵阳: ['涪城区', '游仙区', '江油市', '绵竹市', '安州区', '三台县', '盐亭县'],
  德阳: ['旌阳区', '罗江区', '广汉市', '什邡市', '绵竹市', '中江县'],
  泸州: ['江阳区', '纳溪区', '龙马潭区', '泸县', '合江县', '叙永县', '古蔺县'],
  雅安: ['雨城区', '名山区', '荥经县', '汉源县', '石棉县', '天全县', '芦山县', '宝兴县'],
  南充: ['顺庆区', '高坪区', '嘉陵区', '阆中市', '南部县', '营山县', '蓬安县', '仪陇县', '西充县']
};

export default function ComplaintList() {
  const complaints = useOrderStore((state) => state.complaints);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    city: '',
    county: '',
    dateStart: '',
    dateEnd: '',
    clusterOrderNo: '',
    cellName: '',
    accNbr209: ''
  });
  const pageSize = 20;

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filters.city && c.customerCity !== filters.city) return false;
      if (filters.county && c.county !== filters.county) return false;
      if (filters.cellName && !c.cellName.includes(filters.cellName)) return false;
      if (filters.clusterOrderNo && !c.clusterOrderNo.includes(filters.clusterOrderNo)) return false;
      if (filters.accNbr209 && !c.accNbr209.includes(filters.accNbr209)) return false;
      return true;
    });
  }, [complaints, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredComplaints.length / pageSize);
  const paginatedComplaints = filteredComplaints.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* 筛选区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-7 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">地市</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择地市</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">区县</label>
            <select
              value={filters.county}
              onChange={(e) => setFilters({ ...filters, county: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择区县</option>
              {(filters.city ? countiesByCity[filters.city] : cities.flatMap((city) => countiesByCity[city])).map((county) => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">投诉时间</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateStart}
                onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={filters.dateEnd}
                onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">聚类工单号</label>
            <input
              type="text"
              value={filters.clusterOrderNo}
              onChange={(e) => setFilters({ ...filters, clusterOrderNo: e.target.value })}
              placeholder="请输入"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">家宽209号码</label>
            <input
              type="text"
              value={filters.accNbr209}
              onChange={(e) => setFilters({ ...filters, accNbr209: e.target.value })}
              placeholder="请输入"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">小区名称</label>
            <input
              type="text"
              value={filters.cellName}
              onChange={(e) => setFilters({ ...filters, cellName: e.target.value })}
              placeholder="请输入"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              查询
            </button>
            <button
              type="button"
              onClick={() => setFilters({ city: '', county: '', dateStart: '', dateEnd: '', clusterOrderNo: '', accNbr209: '', cellName: '' })}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
            <button
              type="button"
              className="flex items-center gap-1 px-4 bg-white border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              导出
            </button>
          </div>
        </div>
      </div>

      {/* 表格区域 - 超宽表格支持横向滚动 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '1600px' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs">
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">聚类工单号</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">新一代客户系统流水号</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">受理时间</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">地市</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">区县</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">服务中心</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">小区名称</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">带宽</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">家宽209号码</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">客户标签</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap" style={{ minWidth: '200px' }}>投诉本地分类</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">装维帐号ID</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">卡慢评估</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">物理质量评估</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">是否存在户内网问题</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap" style={{ minWidth: '200px' }}>当日物理异常参数</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">光功率DBM</th>
              <th className="px-2 py-2 text-left text-gray-500 font-medium whitespace-nowrap">接入误码超限率</th>
            </tr>
          </thead>
          <tbody>
            {paginatedComplaints.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 text-xs">
                <td className="px-2 py-2 text-blue-600 cursor-pointer whitespace-nowrap">{c.clusterOrderNo}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.customerSystemId}</td>
                <td className="px-2 py-2 text-gray-500 whitespace-nowrap">{c.acceptDate}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.customerCity}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.county}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.serviceCenter}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.cellName}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.bandwidth}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.accNbr209}</td>
                <td className="px-2 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${c.customerTag.includes('重点') || c.customerTag.includes('钻石') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {c.customerTag.length > 15 ? c.customerTag.substring(0, 15) + '...' : c.customerTag}
                  </span>
                </td>
                <td className="px-2 py-2 max-w-xs truncate" title={c.endType}>{c.endType}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.installUserId}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.homeNetLag}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.homeNetPhyQuality}</td>
                <td className="px-2 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${c.homeNetIsPoor === '是' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {c.homeNetIsPoor}
                  </span>
                </td>
                <td className="px-2 py-2 max-w-xs truncate" title={c.homeNetAbnormal}>{c.homeNetAbnormal || '-'}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.homeNetOpticalPower}</td>
                <td className="px-2 py-2 whitespace-nowrap">{c.homeNetBer}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredComplaints.length)} 共 {filteredComplaints.length} 记录
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 text-sm rounded ${
                    page === pageNum
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-2 text-gray-400">...</span>}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
