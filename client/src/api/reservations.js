import api from "./axios";

const ReservationsAPI = {
  list() {
    return api.get("/reservations").then((r) => r.data);
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
