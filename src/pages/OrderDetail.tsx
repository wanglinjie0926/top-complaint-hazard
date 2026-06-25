import { Component, ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import { OrderStatus, STATUS_MAP, UserRole } from '@/types';
import { ArrowLeft, Paperclip, Upload, X, File } from 'lucide-react';

interface UploadFile {
  name: string;
  size: number;
  type: string;
}

type ModalMode = 'plan' | 'implement' | 'audit' | 'archive' | 'dispatch' | null;

const baseStatusActionMap: Record<OrderStatus, Array<{ label: string; mode: ModalMode; color: string }>> = {
  [OrderStatus.PENDING]: [{ label: '接单', mode: null, color: '#409eff' }],
  [OrderStatus.PLANNING]: [
    { label: '提交方案', mode: 'plan', color: '#67c23a' },
    { label: '挂起', mode: 'plan', color: '#e6a23c' }
  ],
  [OrderStatus.HANGING]: [{ label: '解挂', mode: null, color: '#409eff' }],
  [OrderStatus.IMPLEMENTING]: [{ label: '提交实施结果', mode: 'implement', color: '#67c23a' }],
  [OrderStatus.AUDITING]: [
    { label: '通过', mode: 'audit', color: '#67c23a' },
    { label: '退回', mode: 'audit', color: '#f56c6c' }
  ],
  [OrderStatus.ARCHIVED]: []
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fff' }}>
          <h3>渲染出错</h3>
          <pre style={{ fontSize: 12, overflow: 'auto', maxHeight: 300 }}>{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function OrderDetailInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const orders = useOrderStore((s) => s.orders);
  const currentOrderStore = useOrderStore((s) => s.currentOrder);
  const complaints = useOrderStore((s) => s.complaints);
  const updateOrderFn = useOrderStore((s) => s.updateOrder);
  const currentUser = useAuthStore((s) => s.currentUser);

  const order = useMemo(() => {
    if (!id || !orders) return null;
    return orders.find((item) => item.id === id) ?? null;
  }, [id, orders]);

  const currentOrder = order ?? currentOrderStore;

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalAction, setModalAction] = useState('');
  const [formText, setFormText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const fileInputRef = { current: null as HTMLInputElement | null };

  const actions = useMemo(() => {
    if (!currentOrder) return [];
    const actionList = [...(baseStatusActionMap[currentOrder.status] || [])];
    if (currentOrder.status === OrderStatus.PENDING && currentUser?.role === UserRole.CITY_ADMIN) {
      actionList.push({ label: '转派', mode: null, color: '#e6a23c' });
    }
    return actionList;
  }, [currentOrder, currentUser]);

  const relatedComplaints = useMemo(() => {
    if (!id || !complaints) return [];
    return complaints.filter((item) => (item as any).clusterOrderId === id);
  }, [id, complaints]);

  if (!currentOrder) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-gray-500">
        未找到对应工单，请返回列表重新进入。（id={id}）
      </div>
    );
  }

  const summaryRows = [
    ['聚类工单编号', currentOrder.clusterOrderNo],
    ['派单日期', currentOrder.dispatchDate || '-'],
    ['地市', currentOrder.city],
    ['区县', currentOrder.county],
    ['服务中心', currentOrder.warehouseObjectName || '-'],
    ['当前环节', STATUS_MAP[currentOrder.status]?.label || currentOrder.status],
    ['当前处理人', currentOrder.currentHandler || '-'],
    ['当前状态责任人电话', currentOrder.handlerPhone || '-'],
    ['首次接单时间', currentOrder.receiveTime || '-'],
    [
      '当前历时',
      currentOrder.receiveTime
        ? `${Math.max(1, Math.ceil((new Date().getTime() - new Date(currentOrder.receiveTime).getTime()) / (1000 * 60 * 60 * 24)))}天`
        : '-'
    ],
    ['高报障原因', currentOrder.highFaultReason || '-'],
    ['当前进展', currentOrder.latestProgress || '-']
  ];

  const openModal = (mode: ModalMode, action: string) => {
    setModalMode(mode);
    setModalAction(action);
    setFormText('');
    setUploadedFiles([]);
  };

  const closeModal = () => {
    setModalMode(null);
    setModalAction('');
    setFormText('');
    setUploadedFiles([]);
  };

  const handlePrimaryAction = (label: string) => {
    const today = new Date().toISOString().split('T')[0];
    const historyEntry = {
      time: today,
      action: label,
      operator: currentOrder.currentHandler || '系统',
      remark: ''
    };

    switch (label) {
      case '接单':
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.PLANNING,
          receiveTime: today,
          planTime: today,
          statusUpdateTime: today,
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { ...historyEntry, remark: '接收TOP投诉小区隐患整治工单' }
          ]
        });
        break;
      case '转派':
        updateOrderFn(currentOrder.id, {
          currentHandler: `${currentOrder.county}管理员`,
          handlerRole: UserRole.COUNTY_ADMIN,
          dispatchTarget: currentOrder.county,
          dispatchDate: today,
          statusUpdateTime: today,
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { ...historyEntry, operator: currentUser?.name || '系统', remark: `转派至${currentOrder.county}管理员` }
          ]
        });
        break;
      case '解挂':
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.PLANNING,
          statusUpdateTime: today,
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { ...historyEntry, remark: '解除挂起状态' }
          ]
        });
        break;
      case '挂起':
      case '提交方案':
      case '提交实施结果':
      case '通过':
      case '退回':
        openModal(
          label === '通过' || label === '退回'
            ? 'audit'
            : label === '提交实施结果'
              ? 'implement'
              : 'plan',
          label
        );
        break;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [
      ...prev,
      ...files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const attachments = uploadedFiles.map((f) => f.name);

    switch (modalAction) {
      case '挂起':
        if (!formText.trim()) return;
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.HANGING,
          hangReason: formText.trim(),
          hangTime: today,
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { time: today, action: '工单挂起', operator: currentOrder.currentHandler || '系统', remark: formText.trim() }
          ]
        });
        break;
      case '提交方案':
        if (!formText.trim()) return;
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.IMPLEMENTING,
          planTime: today,
          planReplyTime: today,
          planContent: formText.trim(),
          latestProgress: formText.trim(),
          attachments: [...(currentOrder.attachments || []), ...attachments],
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { time: today, action: '提交方案', operator: currentOrder.currentHandler || '系统', remark: formText.trim() }
          ]
        });
        break;
      case '提交实施结果':
        if (!formText.trim()) return;
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.AUDITING,
          implementTime: today,
          implementContent: formText.trim(),
          latestProgress: formText.trim(),
          attachments: [...(currentOrder.attachments || []), ...attachments],
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { time: today, action: '方案实施', operator: currentOrder.currentHandler || '系统', remark: formText.trim() }
          ]
        });
        break;
      case '通过':
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.ARCHIVED,
          archiveTime: today,
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { time: today, action: '审核通过', operator: currentOrder.currentHandler || '系统', remark: formText.trim() || '审核通过' }
          ]
        });
        break;
      case '退回':
        updateOrderFn(currentOrder.id, {
          status: OrderStatus.IMPLEMENTING,
          statusUpdateTime: today,
          historyProgress: [
            ...(currentOrder.historyProgress || []),
            { time: today, action: '审核退回', operator: currentOrder.currentHandler || '系统', remark: formText.trim() || '需重新实施' }
          ]
        });
        break;
    }
    closeModal();
  };

  const statusColor = STATUS_MAP[currentOrder.status]?.color || '#999';
  const statusLabel = STATUS_MAP[currentOrder.status]?.label || currentOrder.status;
  const historyProgress = currentOrder.historyProgress || [];

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              隐患工单详情 - {currentOrder.clusterOrderNo}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{currentOrder.cellName || '-'}</p>
          </div>
          <span
            className="px-3 py-1 rounded text-sm font-medium"
            style={{ backgroundColor: statusColor + '15', color: statusColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* 左工单信息 + 右处理进展 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左：工单信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">工单信息</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">关键摘要</h4>
                <div className="space-y-2">
                  {summaryRows.map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="w-32 shrink-0 text-gray-500 text-xs">{label}：</span>
                      <span className="text-xs text-gray-800 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2">更多信息</h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-gray-500 text-xs">派发处理对象：</span>
                    <span className="text-xs text-gray-800">{currentOrder.dispatchTarget || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-gray-500 text-xs">户内网质差客户数：</span>
                    <span className="text-xs text-gray-800">{currentOrder.poorHomeNetCount ?? '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-gray-500 text-xs">接入网质差投诉客户数：</span>
                    <span className="text-xs text-gray-800">{currentOrder.poorAccessNetCount ?? '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-gray-500 text-xs">家宽/FTTR/全球通：</span>
                    <span className="text-xs text-gray-800">
                      {currentOrder.broadbandCount ?? '-'} / {currentOrder.fttrCount ?? '-'} /{' '}
                      {currentOrder.globalConnectCount ?? '-'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-gray-500 text-xs">ARPU/上榜次数：</span>
                    <span className="text-xs text-gray-800">
                      {currentOrder.arpuAvg ?? '-'} / {currentOrder.listCount ?? '-'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 shrink-0 text-gray-500 text-xs">阶段回复内容：</span>
                    <span className="text-xs text-gray-800 break-all">{currentOrder.latestProgress || '-'}</span>
                  </div>
                </div>
              </div>
              {currentOrder.attachments && currentOrder.attachments.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">附件列表</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentOrder.attachments.map((file, idx) => (
                      <span
                        key={`${file}-${idx}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs"
                      >
                        <File size={12} />
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右：处理进展 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">处理进展</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 操作按钮区 */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-700">处理流程</h4>
                  <p className="text-xs text-gray-400 mt-0.5">按当前环节执行对应操作</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: statusColor + '15', color: statusColor }}
                >
                  {statusLabel}
                </span>
              </div>
              {actions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handlePrimaryAction(action.label)}
                      className="px-4 py-1.5 rounded-md text-xs font-medium text-white hover:opacity-90"
                      style={{ backgroundColor: action.color }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">当前状态下无可执行操作</p>
              )}
            </div>
            {/* 历史进展时间线 */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3">历史进展</h4>
              <div className="space-y-3">
                {historyProgress.length > 0 ? (
                  historyProgress.slice().reverse().map((record, index) => (
                    <div key={`${record.time}-${index}`} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        {index < historyProgress.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-xs font-medium text-gray-800">{record.action}</span>
                          <span className="text-xs text-gray-400">{record.time}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">操作人：{record.operator}</div>
                        {record.remark && (
                          <div className="text-xs text-gray-400 mt-0.5 break-all">{record.remark}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">暂无历史记录</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部：投诉明细通栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">投诉明细</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
            <Paperclip size={14} />
            关联投诉工单共 {relatedComplaints.length} 条
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">流水号</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">209账号</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">受理时间</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">投诉节点</th>
                </tr>
              </thead>
              <tbody>
                {relatedComplaints.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-blue-600">{(item as any).customerSystemId || item.id}</td>
                    <td className="px-3 py-2">{(item as any).accNbr209 || '-'}</td>
                    <td className="px-3 py-2 text-gray-500">{(item as any).acceptDate || '-'}</td>
                    <td className="px-3 py-2 text-gray-600" style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(item as any).endType || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-800">{modalAction}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {modalMode !== 'archive' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {modalAction === '通过'
                      ? '审核意见'
                      : modalAction === '退回'
                        ? '退回原因'
                        : modalAction === '挂起'
                          ? '挂起原因'
                          : '处理内容'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="请输入内容"
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  附件上传（可选）
                </label>
                <input
                  type="file"
                  ref={fileInputRef as any}
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => (fileInputRef as any).current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
                >
                  <Upload size={14} />
                  点击上传文件
                </button>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-xs"
                      >
                        <File size={14} className="text-gray-400" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-gray-400">{(file.size / 1024).toFixed(1)}KB</span>
                        <button onClick={() => handleRemoveFile(idx)} className="text-gray-400 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitForm}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  确认{modalAction}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetail() {
  return (
    <ErrorBoundary>
      <OrderDetailInner />
    </ErrorBoundary>
  );
}
