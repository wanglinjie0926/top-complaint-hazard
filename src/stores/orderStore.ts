import { create } from 'zustand';
import { HiddenOrder, OrderStatus, ComplaintDetail } from '@/types';
import { mockOrders, mockComplaints } from '@/data/mockOrders';

interface OrderState {
  orders: HiddenOrder[];
  complaints: ComplaintDetail[];
  currentOrder: HiddenOrder | null;
  filters: {
    city: string;
    county: string;
    status: OrderStatus | '';
    dateStart: string;
    dateEnd: string;
    orderNo: string;
    cellName: string;
    scene: string;
    overdue: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  setFilters: (filters: Partial<OrderState['filters']>) => void;
  resetFilters: () => void;
  setCurrentOrder: (order: HiddenOrder | null) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrder: (orderId: string, patch: Partial<HiddenOrder>) => void;
  submitPlan: (orderId: string, text: string, attachments: string[]) => void;
  submitResult: (orderId: string, text: string, attachments: string[]) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: mockOrders,
  complaints: mockComplaints,
  currentOrder: null,
  filters: {
    city: '',
    county: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    orderNo: '',
    cellName: '',
    scene: '',
    overdue: ''
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: mockOrders.length
  },
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  resetFilters: () => set({
    filters: {
      city: '',
      county: '',
      status: '',
      dateStart: '',
      dateEnd: '',
      orderNo: '',
      cellName: '',
      scene: '',
      overdue: ''
    }
  }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map((order) =>
      order.id === orderId ? { ...order, status } : order
    )
  })),
  updateOrder: (orderId, patch) => set((state) => ({
    orders: state.orders.map((order) =>
      order.id === orderId ? { ...order, ...patch } : order
    ),
    currentOrder: state.currentOrder?.id === orderId
      ? { ...state.currentOrder, ...patch }
      : state.currentOrder
  })),
  submitPlan: (orderId, text, attachments) => set((state) => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const updateOrder = (order: HiddenOrder): HiddenOrder => ({
      ...order,
      planContent: text,
      attachments: [...(order.attachments || []), ...attachments],
      status: OrderStatus.IMPLEMENTING,
      historyProgress: [
        ...order.historyProgress,
        { time: now, action: '提交方案', operator: order.currentHandler, remark: text }
      ]
    });
    return {
      orders: state.orders.map((o) => o.id === orderId ? updateOrder(o) : o),
      currentOrder: state.currentOrder?.id === orderId ? updateOrder(state.currentOrder) : state.currentOrder
    };
  }),
  submitResult: (orderId, text, attachments) => set((state) => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const updateOrder = (order: HiddenOrder): HiddenOrder => ({
      ...order,
      implementContent: text,
      attachments: [...(order.attachments || []), ...attachments],
      status: OrderStatus.AUDITING,
      historyProgress: [
        ...order.historyProgress,
        { time: now, action: '提交实施结果', operator: order.currentHandler, remark: text }
      ]
    });
    return {
      orders: state.orders.map((o) => o.id === orderId ? updateOrder(o) : o),
      currentOrder: state.currentOrder?.id === orderId ? updateOrder(state.currentOrder) : state.currentOrder
    };
  })
}));
