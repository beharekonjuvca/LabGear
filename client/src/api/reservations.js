import api from "./axios";

const ReservationsAPI = {
  list({ page = 1, limit = 10, status, itemId, userId, from, to, q } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (itemId) params.itemId = itemId;
    if (userId) params.userId = userId;
    if (from) params.from = from;
    if (to) params.to = to;
    if (q) params.q = q;
    return api.get("/reservations", { params }).then((r) => r.data);
  },
  create({ item_id, start_date, end_date }) {
    return api
      .post("/reservations", { item_id, start_date, end_date })
      .then((r) => r.data);
  },
  approve(id) {
    return api.patch(`/reservations/${id}/approve`).then((r) => r.data);
  },
  cancel(id) {
    return api.patch(`/reservations/${id}/cancel`).then((r) => r.data);
  },
  async listApproved() {
    const res = await api.get("/reservations");
    return (res.data?.data || []).filter((r) => r.status === "APPROVED");
  },
};

export default ReservationsAPI;
