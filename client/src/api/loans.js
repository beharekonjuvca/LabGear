import api from "./axios";

const LoansAPI = {
  list({ page = 1, limit = 10, status, itemId, userId, from, to, q } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (itemId) params.itemId = itemId;
    if (userId) params.userId = userId;
    if (from) params.from = from;
    if (to) params.to = to;
    if (q) params.q = q;
    return api.get("/loans", { params }).then((r) => r.data); // -> { data, page, limit, total }
  },
  create({ reservation_id, due_at }) {
    return api.post("/loans", { reservation_id, due_at }).then((r) => r.data);
  },
  returnLoan(id) {
    return api.patch(`/loans/${id}/return`).then((r) => r.data);
  },
};

export default LoansAPI;
