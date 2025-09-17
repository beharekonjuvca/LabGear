import api from "./axios";

const ItemsAPI = {
  list({ page = 1, limit = 12, search = "", category = "", available } = {}) {
    const params = { page, limit, search };
    if (category) params.category = category;
    if (available !== undefined) params.available = available;
    return api.get("/items", { params }).then((r) => r.data);
  },
  availability(itemId, from, to) {
    return api
      .get(`/items/${itemId}/availability`, { params: { from, to } })
      .then((r) => r.data);
  },

  async listAllSimple() {
    const res = await this.list({ page: 1, limit: 1000 });
    return res.data;
  },
};

export default ItemsAPI;
