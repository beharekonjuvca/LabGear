import api from "./axios";
function toFormData(values) {
  const fd = new FormData();
  if (values.name) fd.append("name", values.name);
  if (values.code) fd.append("code", values.code);
  if (values.category) fd.append("category", values.category);
  if (values.condition_note) fd.append("condition_note", values.condition_note);
  if (typeof values.available === "boolean") {
    fd.append("available", String(values.available));
  }
  if (values.imageFile) {
    fd.append("image", values.imageFile);
  } else if (values.image_url) {
    fd.append("image_url", values.image_url);
  }
  return fd;
}

const ItemsAPI = {
  list({ page = 1, limit = 12, search = "", category = "", available } = {}) {
    const params = { page, limit, search };
    if (category) params.category = category;
    if (available !== undefined) params.available = available;
    return api.get("/items", { params }).then((r) => r.data);
  },

  getOne(id) {
    return api.get(`/items/${id}`).then((r) => r.data);
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
  create(values) {
    const fd = toFormData(values);
    return api.post("/items", fd).then((r) => r.data);
  },
  update(id, values) {
    const fd = toFormData(values);
    return api.put(`/items/${id}`, fd).then((r) => r.data);
  },

  remove(id) {
    return api.delete(`/items/${id}`).then((r) => r.data);
  },
};

export default ItemsAPI;
