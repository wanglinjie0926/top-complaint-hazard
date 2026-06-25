import { HiddenOrder, OrderStatus, UserRole, ComplaintDetail } from '@/types';

const cities = ['绵阳', '德阳', '泸州', '雅安', '南充'];
const counties: Record<string, string[]> = {
  '绵阳': ['涪城区', '游仙区', '江油市', '绵竹市', '安州区', '三台县', '盐亭县'],
  '德阳': ['旌阳区', '罗江区', '广汉市', '什邡市', '绵竹市', '中江县'],
  '泸州': ['江阳区', '纳溪区', '龙马潭区', '泸县', '合江县', '叙永县', '古蔺县'],
  '雅安': ['雨城区', '名山区', '荥经县', '汉源县', '石棉县', '天全县', '芦山县', '宝兴县'],
  '南充': ['顺庆区', '高坪区', '嘉陵区', '阆中市', '南部县', '营山县', '蓬安县', '仪陇县', '西充县']
};
const scenes = ['问题装维库', '问题小区库', '质差聚类库'];
const categories = ['装维服务问题', '网络质量问题', '客户使用问题'];
const complaintReasons = ['网络卡顿', '掉线频繁', '光猫故障', 'WiFi覆盖差', '外线故障', 'IPTV卡顿', '上网慢', '拨号失败'];
const forms = ['问题装维库', '问题小区库', '质差聚类库'];
const objects = ['装维', '小区', '网络'];
const names = ['zhouyu_jy', 'xiangqiulin_dy', 'zhoumaoping_lz', 'wangwei_my', 'zhangsan_md', 'lisi_my'];

// 每个状态分配 50 条，共 300 条
const allStatuses: OrderStatus[] = [
  ...Array(50).fill(OrderStatus.PENDING),
  ...Array(50).fill(OrderStatus.PLANNING),
  ...Array(50).fill(OrderStatus.HANGING),
  ...Array(50).fill(OrderStatus.IMPLEMENTING),
  ...Array(50).fill(OrderStatus.AUDITING),
  ...Array(50).fill(OrderStatus.ARCHIVED),
];

export const mockOrders: HiddenOrder[] = allStatuses.map((status, i) => {
  const city = cities[i % cities.length];
  const countyArr = counties[city];
  const county = countyArr[i % countyArr.length];
  const handlerRole = Math.random() > 0.5 ? UserRole.CITY_ADMIN : UserRole.COUNTY_ADMIN;

  return {
    id: `order-${i + 1}`,
    clusterOrderNo: `${240000 + i + 1}`,
    city,
    county,
    cellCode: `CELL${String(i + 1).padStart(6, '0')}`,
    cellName: `${city}${county}测试小区${i + 1}`,
    complaintCount: Math.floor(Math.random() * 50) + 1,
    status,
    currentHandler: names[Math.floor(Math.random() * names.length)],
    handlerRole,
    receiveTime: `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:15:26`,
    faultOrderCount: Math.floor(Math.random() * 80) + 20,
    complaintTop1: complaintReasons[i % complaintReasons.length],
    complaintTop1Ratio: `${(Math.random() * 30 + 20).toFixed(1)}%`,
    complaintTop2: complaintReasons[(i + 3) % complaintReasons.length],
    complaintTop2Ratio: `${(Math.random() * 20 + 10).toFixed(1)}%`,
    broadbandCount: Math.floor(Math.random() * 500) + 100,
    listCount: Math.floor(Math.random() * 10) + 1,
    poorHomeNetCount: Math.floor(Math.random() * 40) + 5,
    poorAccessNetCount: Math.floor(Math.random() * 30) + 5,
    planReplyTime: status !== OrderStatus.PENDING ? `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')} 10:30:00` : undefined,
    planTime: status !== OrderStatus.PENDING ? `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')} 10:30:00` : undefined,
    implementTime: [OrderStatus.IMPLEMENTING, OrderStatus.AUDITING, OrderStatus.ARCHIVED].includes(status) ? `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')} 14:00:00` : undefined,
    archiveTime: status === OrderStatus.ARCHIVED ? `2026-06-10 16:00:00` : undefined,
    latestProgress: '正在进行网络优化整改',
    historyProgress: [
      { time: '2026-06-12 00:15:26', action: '派单', operator: '系统', remark: '大音平台派单' },
      { time: '2026-06-12 08:30:00', action: '接单', operator: names[Math.floor(Math.random() * names.length)], remark: '' },
      ...(status !== OrderStatus.PENDING ? [{ time: '2026-06-12 10:30:00', action: '提交方案', operator: names[Math.floor(Math.random() * names.length)], remark: '提交整治方案' }] : [])
    ],
    highFaultReason: '单一网络故障高小区',
    attachments: ['方案.docx', '现场照片.jpg'],
    warehouseScene: scenes[Math.floor(Math.random() * scenes.length)],
    warehouseCategory: categories[Math.floor(Math.random() * categories.length)],
    warehouseForm: forms[Math.floor(Math.random() * forms.length)],
    warehouseObject: objects[Math.floor(Math.random() * objects.length)],
    warehouseObjectName: names[Math.floor(Math.random() * names.length)],
    firstProcessTime: `2026-06-12 0${Math.floor(Math.random() * 5) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
  };
});

// 投诉内容模板（模拟真实长文本）
const endTypes = [
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-LOS红灯，无法上网-家庭宽带单障',
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-所有场景网速卡顿-全局流转',
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-网络无法连接-光猫掉电',
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-局部区域网速卡顿-单用户',
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-WiFi信号弱-覆盖不全',
  '家庭市场-通信连接-家庭宽带-本省宽带-IPTV体验-IPTV画面卡顿-马赛克',
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-所有场景网速卡顿-多用户',
  '家庭市场-通信连接-家庭宽带-本省宽带-网络体验-网络无法连接-外线故障'
];

const customerTags = [
  '全家享随心看A88,普卡',
  '全家享随心看B228,全球通银卡,高价值（网络）',
  '全球通钻石卡,客体重点客户,wifi盲（普通客户）,智慧爱家5G版（全家福）128',
  '全家享随心看C388,全球通金卡,高价值（网络）',
  '普通客户',
  '千兆客户',
  '千兆客户/投诉客户'
];

const cellSuffixes = [
  '瑞云社区四期', '香江家园', '锦绣花园', '金碧华庭',
  '绿洲小区', '蓝湾半岛', '紫云山庄', '金域蓝湾'
];

export const mockComplaints: ComplaintDetail[] = Array.from({ length: 500 }, (_, i) => {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const countyArr = counties[city];
  const county = countyArr[Math.floor(Math.random() * countyArr.length)];
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const hour = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
  const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');

  const cellSuffix = cellSuffixes[Math.floor(Math.random() * cellSuffixes.length)];
  const cellName = `${city}${county}${cellSuffix}`;
  const accNbr = `217${String(Math.floor(Math.random() * 90000000) + 10000000)}`;
  const power = `-${(Math.random() * 10 + 15).toFixed(2)}`;

  return {
    id: `complaint-${i + 1}`,
    clusterOrderId: `order-${(Math.floor(Math.random() * 300)) + 1}`,
    // 基础信息
    clusterOrderNo: `202605_${String(Math.floor(Math.random() * 900000) + 100000)}`,
    customerSystemId: `202605${day}${hour}${minute}X${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    acceptDate: `2026/5/${day} ${hour}:${minute}`,
    customerCity: city,
    county,
    serviceCenter: `${county}服务中心`,
    cellName,
    bandwidth: `${[100, 200, 300, 500, 1000][Math.floor(Math.random() * 5)]}M`,
    accNbr209: accNbr,
    customerTag: customerTags[Math.floor(Math.random() * customerTags.length)],
    endType: endTypes[Math.floor(Math.random() * endTypes.length)],
    installUserId: `${['cd', 'xd', 'my', 'dy', 'lz'][Math.floor(Math.random() * 5)]}_${['huhan', 'yangxu', 'zhangcong', 'mohuirong', 'huxiwen', 'zhouyu'][Math.floor(Math.random() * 6)]}`,
    // 户内网信息
    homeNetLag: ['流畅', '轻微卡顿', '卡顿', '严重卡顿'][Math.floor(Math.random() * 4)],
    homeNetPhyQuality: ['优良', '一般', '差', ''][Math.floor(Math.random() * 4)],
    homeNetIsPoor: Math.random() > 0.5 ? '否' : '是',
    homeNetAbnormal: Math.random() > 0.6 ? '' : `${(Math.floor(Math.random() * 9000000000000) + 1000000000000).toString(16).toUpperCase()}路由器5G低速率占比${Math.floor(Math.random() * 80) + 10}%`,
    homeNetOpticalPower: power,
    homeNetBer: '0'
  };
});
