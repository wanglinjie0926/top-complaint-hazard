import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import { OrderStatus, STATUS_MAP, UserRole } from '@/types';
import { Download, AlertTriangle, Clock, CheckCircle, Archive, PauseCircle, X, Upload, File } from 'lucide-react';

const cities = ['绵阳', '德阳', '泸州', '雅安', '南充'];
const scenes = ['问题装维库', '问题小区库', '质差聚类库'];
const countiesByCity: Record<string, string[]> = {
  绵阳: ['涪城区', '游仙区', '江油市', '绵竹市', '安州区', '三台县', '盐亭县'],
  德阳: ['旌阳区', '罗江区', '广汉市', '什邡市', '绵竹市', '中江县'],
  泸州: ['江阳区', '纳溪区', '龙马潭区', '泸县', '合江县', '叙永县', '古蔺县'],
  雅安: ['雨城区', '名山区', '荥经县', '汉源县', '石棉县', '天全县', '芦山县', '宝兴县'],
  南充: ['顺庆区', '高坪区', '嘉陵区', '阆中市', '南部县', '营山县', '蓬安县', '仪陇县', '西充县']
};

const statCards = [
  { label: '待接单', key: OrderStatus.PENDING, icon: AlertTriangle, color: '#e6a23c', bgColor: '#fdf6ec' },
  { label: '方案制定中', key: OrderStatus.PLANNING, icon: Clock, color: '#409eff', bgColor: '#ecf5ff' },
  { label: '实施中', key: OrderStatus.IMPLEMENTING, icon: CheckCircle, color: '#67c23a', bgColor: '#f0f9eb' },
  { label: '审核中', key: OrderStatus.AUDITING, icon: AlertTriangle, color: '#a855f7', bgColor: '#f3e8ff' },
  { label: '工单挂起', key: OrderStatus.HANGING, icon: PauseCircle, color: '#ef4444', bgColor: '#fef2f2' },
  { label: '已归档', key: OrderStatus.ARCHIVED, icon: Archive, color: '#606266', bgColor: '#f9f9f9' }
];

// 各状态对应的可执行操作
const baseStatusActionMap: Record<OrderStatus, Array<{ label: string; needForm?: boolean; color: string }>> = {
  [OrderStatus.PENDING]: [{ label: '接单', color: '#409eff' }],
  [OrderStatus.PLANNING]: [
    { label: '提交方案', needForm: true, color: '#67c23a' },
    { label: '挂起', needForm: true, color: '#e6a23c' }
  ],
  [OrderStatus.HANGING]: [{ label: '解挂', color: '#409eff' }],
  [OrderStatus.IMPLEMENTING]: [{ label: '提交实施结果', needForm: true, color: '#67c23a' }],
  [OrderStatus.AUDITING]: [
    { label: '通过', needForm: false, color: '#67c23a' },
    { label: '退回', needForm: true, color: '#f56c6c' }
  ],
  [OrderStatus.ARCHIVED]: []
};

interface UploadFile {
  name: string;
  size: number;
}

export default function OrderList() {
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.orders);
  const currentUser = useAuthStore((state) => state.currentUser);
  const filters = useOrderStore((state) => state.filters);
  const setFilters = useOrderStore((state) => state.setFilters);
  const resetFilters = useOrderStore((state) => state.resetFilters);
  const setCurrentOrder = useOrderStore((state) => state.setCurrentOrder);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 处理弹窗状态
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processTargetOrder, setProcessTargetOrder] = useState<string | null>(null);
  const [formAction, setFormAction] = useState('');
  const [formText, setFormText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 筛选
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.city && order.city !== filters.city) return false;
      if (filters.county && order.county !== filters.county) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.orderNo && !order.clusterOrderNo.includes(filters.orderNo)) return false;
      if (filters.cellName && !order.cellName.includes(filters.cellName)) return false;
      if (filters.dateStart && order.receiveTime && order.receiveTime.split(' ')[0] < filters.dateStart) return false;
      if (filters.dateEnd && order.receiveTime && order.receiveTime.split(' ')[0] > filters.dateEnd) return false;
      if (filters.scene && order.warehouseScene !== filters.scene) return false;
      return true;
    });
  }, [orders, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const stats = useMemo(() => {
    const scopedOrders = currentUser?.role === 'city_admin'
      ? orders
      : orders.filter((order) => order.county === currentUser?.county);

    return statCards.map((card) => ({
      ...card,
      count: scopedOrders.filter((order) => order.status === card.key).length
    }));
  }, [orders, currentUser]);

  // 分页
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // 处理：打开操作弹窗
  const handleProcess = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    setProcessTargetOrder(id);
    setProcessModalOpen(true);
    setFormAction('');
    setFormText('');
    setUploadedFiles([]);
  };

  // 详情：跳转到详情页
  const handleDetail = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (order) setCurrentOrder(order);
    navigate(`/orders/${id}`);
  };

  // 获取当前操作的工单
  const targetOrder = processTargetOrder ? orders.find((o) => o.id === processTargetOrder) : null;
  const targetActions = useMemo(() => {
    if (!targetOrder) return [];
    const actions = [...(baseStatusActionMap[targetOrder.status] || [])];
    if (targetOrder.status === OrderStatus.PENDING && currentUser?.role === UserRole.CITY_ADMIN) {
      actions.push({ label: '转派', color: '#e6a23c' });
    }
    return actions;
  }, [targetOrder, currentUser]);

  // 执行操作
  const executeAction = (actionLabel: string) => {
    if (!targetOrder) return;

    const today = new Date().toISOString().split('T')[0];

    // 不需要表单的操作直接执行
    if (actionLabel === '接单') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.PLANNING,
        currentHandler: targetOrder.currentHandler || '待分派',
        receiveTime: today,
        statusUpdateTime: today,
        planTime: today,
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '接单', operator: targetOrder.currentHandler || '系统', remark: '接收TOP投诉小区隐患整治工单' }
        ]
      });
      setProcessModalOpen(false);
      return;
    }

    if (actionLabel === '转派') {
      updateOrder(targetOrder.id, {
        currentHandler: `${targetOrder.county}管理员`,
        handlerRole: UserRole.COUNTY_ADMIN,
        dispatchTarget: targetOrder.county,
        dispatchDate: today,
        statusUpdateTime: today,
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '转派', operator: currentUser?.name || '系统', remark: `转派至${targetOrder.county}管理员` }
        ]
      });
      setProcessModalOpen(false);
      return;
    }

    if (actionLabel === '解挂') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.PLANNING,
        statusUpdateTime: today,
        hangReason: undefined,
        hangTime: undefined,
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '解挂', operator: targetOrder.currentHandler || '系统', remark: '解除挂起状态' }
        ]
      });
      setProcessModalOpen(false);
      return;
    }

    // 需要表单的操作：切换到表单模式
    setFormAction(actionLabel);
    setFormText('');
    setUploadedFiles([]);
  };

  // 提交表单
  const handleSubmitForm = () => {
    if (!targetOrder || !formText.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const fileNames = uploadedFiles.map((f) => f.name);

    if (formAction === '提交方案') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.IMPLEMENTING,
        planTime: today,
        planReplyTime: today,
        planContent: formText.trim(),
        latestProgress: formText.trim(),
        statusUpdateTime: today,
        attachments: [...(targetOrder.attachments || []), ...fileNames],
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '提交方案', operator: targetOrder.currentHandler || '系统', remark: formText.trim() }
        ]
      });
    } else if (formAction === '挂起') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.HANGING,
        hangReason: formText.trim(),
        hangTime: today,
        statusUpdateTime: today,
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '工单挂起', operator: targetOrder.currentHandler || '系统', remark: formText.trim() }
        ]
      });
    } else if (formAction === '提交实施结果') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.AUDITING,
        implementTime: today,
        implementContent: formText.trim(),
        latestProgress: formText.trim(),
        statusUpdateTime: today,
        attachments: [...(targetOrder.attachments || []), ...fileNames],
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '方案实施', operator: targetOrder.currentHandler || '系统', remark: formText.trim() }
        ]
      });
    } else if (formAction === '通过') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.ARCHIVED,
        archiveTime: today,
        statusUpdateTime: today,
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '审核通过', operator: targetOrder.currentHandler || '系统', remark: formText.trim() || '审核通过' }
        ]
      });
    } else if (formAction === '退回') {
      updateOrder(targetOrder.id, {
        status: OrderStatus.IMPLEMENTING,
        statusUpdateTime: today,
        historyProgress: [
          ...targetOrder.historyProgress,
          { time: today, action: '审核退回', operator: targetOrder.currentHandler || '系统', remark: formText.trim() || '需重新实施' }
        ]
      });
    }

    setProcessModalOpen(false);
  };

  const handleCloseModal = () => {
    setProcessModalOpen(false);
    setProcessTargetOrder(null);
    setFormAction('');
    setFormText('');
    setUploadedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: UploadFile[] = Array.from(files).map((f) => ({ name: f.name, size: f.size }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFormPlaceholder = () => {
    switch (formAction) {
      case '提交方案': return '请输入整治方案内容...';
      case '挂起': return '请输入挂起原因...';
      case '提交实施结果': return '请输入实施结果...';
      case '通过': return '请输入审核意见（可选）...';
      case '退回': return '请输入退回原因...';
      default: return '';
    }
  };

  const getFormLabel = () => {
    switch (formAction) {
      case '提交方案': return '方案内容';
      case '挂起': return '挂起原因';
      case '提交实施结果': return '实施结果';
      case '通过': return '审核意见';
      case '退回': return '退回原因';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">隐患工单明细</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="group relative bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                style={{ backgroundColor: stat.color }}
              />
              <div className="flex items-center justify-between gap-3 pl-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
                  <p
                    className="text-3xl font-black tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {stat.count}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 筛选区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-7 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">环节状态</label>
            <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value as OrderStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">请选择</option>
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>{STATUS_MAP[s].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">地市</label>
            <select value={filters.city} onChange={(e) => setFilters({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">请选择地市</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">区县</label>
            <select value={filters.county} onChange={(e) => setFilters({ county: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">请选择区县</option>
              {(filters.city ? countiesByCity[filters.city] : cities.flatMap((city) => countiesByCity[city])).map((county) =>
                <option key={county} value={county}>{county}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">派单时间</label>
            <div className="flex items-center gap-1">
              <input type="date" value={filters.dateStart} onChange={(e) => setFilters({ dateStart: e.target.value })}
                className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-gray-400">-</span>
              <input type="date" value={filters.dateEnd} onChange={(e) => setFilters({ dateEnd: e.target.value })}
                className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">聚类工单号</label>
            <input type="text" value={filters.orderNo} onChange={(e) => setFilters({ orderNo: e.target.value })} placeholder="请输入"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">小区名称</label>
            <input type="text" value={filters.cellName} onChange={(e) => setFilters({ cellName: e.target.value })} placeholder="请输入"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => setPage(1)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">查询</button>
            <button onClick={() => { resetFilters(); setPage(1); }}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">重置</button>
            <button className="flex items-center gap-1 px-3 bg-white border border-gray-300 text-gray-700 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
              <Download size={14} />导出
            </button>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">聚类工单编号</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">派单日期</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">地市</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">区县</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">服务中心</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">小区名称</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">报障工单量</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">投诉原因TOP1</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">占比</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">投诉原因TOP2</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">占比</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">家宽客户数</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">上榜次数</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">户内网质差投诉客户量</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">接入网质差投诉客户量</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">当前环节</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">当前环节回复时间</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">首次接单时间</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">当前历时</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">当前状态责任人</th>
              <th className="px-3 py-3 text-left text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => {
              const elapsedDays = order.receiveTime
                ? Math.max(1, Math.ceil((new Date().getTime() - new Date(order.receiveTime).getTime()) / (1000 * 60 * 60 * 24)))
                : '-';
              return (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleDetail(order.id)}>{order.clusterOrderNo}</td>
                  <td className="px-3 py-3 text-gray-500">{order.receiveTime ? order.receiveTime.split(' ')[0] : '-'}</td>
                  <td className="px-3 py-3">{order.city}</td>
                  <td className="px-3 py-3">{order.county}</td>
                  <td className="px-3 py-3">{order.warehouseObjectName || '-'}</td>
                  <td className="px-3 py-3">{order.cellName}</td>
                  <td className="px-3 py-3">{order.faultOrderCount}</td>
                  <td className="px-3 py-3">{order.complaintTop1}</td>
                  <td className="px-3 py-3">{order.complaintTop1Ratio}</td>
                  <td className="px-3 py-3">{order.complaintTop2}</td>
                  <td className="px-3 py-3">{order.complaintTop2Ratio}</td>
                  <td className="px-3 py-3">{order.broadbandCount}</td>
                  <td className="px-3 py-3">{order.listCount}</td>
                  <td className="px-3 py-3">{order.poorHomeNetCount}</td>
                  <td className="px-3 py-3">{order.poorAccessNetCount}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: STATUS_MAP[order.status].color + '15', color: STATUS_MAP[order.status].color }}>
                      {STATUS_MAP[order.status].label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500">{order.planReplyTime || '-'}</td>
                  <td className="px-3 py-3 text-gray-500">{order.receiveTime || '-'}</td>
                  <td className="px-3 py-3">{elapsedDays}天</td>
                  <td className="px-3 py-3">{order.currentHandler || '-'}</td>
                  <td className="px-3 py-3">
                    <span className="text-blue-600 cursor-pointer hover:underline mr-3 font-medium"
                      onClick={(e) => { e.stopPropagation(); handleProcess(order.id); }}>处理</span>
                    <span className="text-blue-600 cursor-pointer hover:underline"
                      onClick={(e) => { e.stopPropagation(); handleDetail(order.id); }}>详情</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 分页 */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredOrders.length)} 共 {filteredOrders.length} 记录
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(1)} disabled={page === 1}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">&lt;</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <button key={i} onClick={() => handlePageChange(i + 1)}
                className={`w-8 h-8 text-sm rounded ${page === i + 1 ? 'bg-blue-600 text-white border border-blue-600' : 'border border-gray-300 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">&gt;</button>
          </div>
        </div>
      </div>

      {/* ====== 处理操作弹窗 ====== */}
      {processModalOpen && targetOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  {formAction ? formAction : '工单处理'}
                </h3>
                {!formAction && (
                  <p className="text-xs text-gray-500 mt-1">
                    工单号：{targetOrder.clusterOrderNo} | 当前环节：{STATUS_MAP[targetOrder.status].label}
                  </p>
                )}
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 操作按钮区（未选择具体操作时显示） */}
              {!formAction && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">请选择要执行的操作：</p>
                  <div className="flex flex-wrap gap-3">
                    {targetActions.map((action) => (
                      <button key={action.label}
                        onClick={() => executeAction(action.label)}
                        className="px-5 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: action.color }}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                  {targetActions.length === 0 && (
                    <p className="text-sm text-gray-400">当前状态下无可执行操作（已归档）</p>
                  )}
                </div>
              )}

              {/* 表单区（选择了需要表单的操作后显示） */}
              {formAction && (
                <>
                  <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700">当前环节：</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: STATUS_MAP[targetOrder.status].color + '15', color: STATUS_MAP[targetOrder.status].color }}>
                        {STATUS_MAP[targetOrder.status].label}
                      </span>
                      <span className="font-medium text-gray-700 ml-2">操作：</span>
                      <span className="text-blue-600 font-medium">{formAction}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFormLabel()}
                      {(formAction !== '通过') && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea value={formText} onChange={(e) => setFormText(e.target.value)}
                      placeholder={getFormPlaceholder()}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                  </div>

                  {/* 附件上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">附件上传（可选）</label>
                    <input type="file" ref={fileInputRef} multiple onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                      <Upload size={14} />点击上传文件
                    </button>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadedFiles.map((file, idx) => (
                          <div key={`${file.name}-${idx}`} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-xs">
                            <File size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-gray-400 shrink-0">{(file.size / 1024).toFixed(1)}KB</span>
                            <button onClick={() => handleRemoveFile(idx)} className="text-gray-400 hover:text-red-500 shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setFormAction('')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      返回
                    </button>
                    <button onClick={handleSubmitForm}
                      disabled={!formText.trim() && formAction !== '通过'}
                      className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      确认{formAction}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
