// 用户角色
export enum UserRole {
  CITY_ADMIN = 'city_admin',
  COUNTY_ADMIN = 'county_admin'
}

// 工单状态
export enum OrderStatus {
  PENDING = 'pending',           // 待接单
  PLANNING = 'planning',         // 方案制定
  HANGING = 'hanging',           // 工单挂起
  IMPLEMENTING = 'implementing', // 实施中
  AUDITING = 'auditing',         // 审核中
  ARCHIVED = 'archived'          // 已归档
}

// 状态标签映射
export const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: '待接单', color: '#e6a23c' },
  [OrderStatus.PLANNING]: { label: '方案制定', color: '#409eff' },
  [OrderStatus.HANGING]: { label: '工单挂起', color: '#909399' },
  [OrderStatus.IMPLEMENTING]: { label: '实施中', color: '#67c23a' },
  [OrderStatus.AUDITING]: { label: '审核中', color: '#0ea5e9' },
  [OrderStatus.ARCHIVED]: { label: '已归档', color: '#f56c6c' }
}

// 隐患工单
export interface HiddenOrder {
  id: string;
  clusterOrderNo: string;
  dispatchDate?: string;
  city: string;
  county: string;
  cellCode: string;
  cellName: string;
  complaintCount: number;
  status: OrderStatus;
  currentHandler: string;
  handlerRole: UserRole;
  dispatchTarget?: string;
  handlerPhone?: string;
  receiveTime: string;
  // 新增列表展示字段
  faultOrderCount: number;
  complaintTop1: string;
  complaintTop1Ratio: string;
  complaintTop2: string;
  complaintTop2Ratio: string;
  broadbandCount: number;
  listCount: number;
  poorHomeNetCount: number;
  poorAccessNetCount: number;
  planTime?: string;
  planReplyTime?: string;
  implementTime?: string;
  archiveTime?: string;
  statusUpdateTime?: string;
  latestProgress: string;
  historyProgress: HistoryRecord[];
  hangReason?: string;
  hangTime?: string;
  planContent?: string;
  implementContent?: string;
  auditContent?: string;
  archiveResult?: string;
  highFaultReason?: string;
  attachments?: string[];
  fttrCount?: number;
  globalConnectCount?: number;
  arpuAvg?: string;
  warehouseScene?: string; // 入库场景
  warehouseCategory?: string; // 入库类别
  warehouseForm?: string; // 入库形态
  warehouseObject?: string; // 入库对象
  warehouseObjectName?: string; // 入库对象名称
  firstProcessTime?: string; // 工单首次处理时间
}

// 历史进展记录
export interface HistoryRecord {
  time: string;
  action: string;
  operator: string;
  remark?: string;
}

// 投诉工单明细（简化后主要字段）
export interface ComplaintDetail {
  id: string;
  clusterOrderId: string;      // 关联的隐患工单ID
  // 基础信息
  clusterOrderNo: string;      // 聚类工单号
  customerSystemId: string;    // 新一代客户系统流水号
  acceptDate: string;          // 受理时间
  customerCity: string;        // 地市
  county: string;              // 区县
  serviceCenter: string;       // 服务中心
  cellName: string;            // 小区名称
  bandwidth: string;           // 带宽
  accNbr209: string;           // 家宽209号码
  customerTag: string;         // 客户标签
  endType: string;             // 投诉本地分类
  installUserId: string;       // 装维帐号ID
  // 户内网信息
  homeNetLag: string;          // 卡慢评估
  homeNetPhyQuality: string;   // 物理质量评估
  homeNetIsPoor: string;       // 是否存在户内网问题
  homeNetAbnormal: string;     // 当日物理异常参数
  homeNetOpticalPower: string; // 光功率DBM
  homeNetBer: string;          // 接入误码超限率
}

// 用户
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  city: string;
  county?: string;
}
