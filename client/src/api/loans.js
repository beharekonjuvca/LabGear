import api from "./axios";

const LoansAPI = {
  list(status) {
    return api
      .get("/loans", { params: status ? { status } : {} })
      .then((r) => r.data);
  },
  create({ reservation_id, due_at }) {
    return api.post("/loans", { reservation_id, due_at }).then((r) => r.data);
  },
  returnLoan(id) {
    return api.patch(`/loans/${id}/return`).then((r) => r.data);
  },
};

export default LoansAPI;
